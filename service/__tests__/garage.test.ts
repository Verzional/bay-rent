import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/prisma/db';
import {
  batchCreateGaragesAction,
  getMaxCodeSequenceByType,
  getPublicFacilitySummary,
  listAvailableGaragesForToday,
  listGarages,
} from '../garage';
import type { MockDb } from './helpers/db-mock';

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  requireSessionUser: vi.fn(),
  syncExpiredRentals: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/session', () => ({
  requireAdmin: mocks.requireAdmin,
  requireSessionUser: mocks.requireSessionUser,
}));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock('../rental', () => ({ syncExpiredRentals: mocks.syncExpiredRentals }));
vi.mock('@/prisma/db', async () => {
  const { createDbMock } = await import('./helpers/db-mock');
  return { db: createDbMock() };
});

const mockDb = db as unknown as MockDb;
const { Garage } = mockDb.models;

const initialState = { success: false, message: '' };

function form(values: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

function garageRow(overrides: Record<string, unknown> = {}) {
  return {
    garage_code: 'S001',
    type: 'BIKE',
    daily_rate: 10_000,
    kwh_rate: null,
    status: 'AVAILABLE',
    created_at: new Date('2026-01-01T00:00:00Z'),
    updated_at: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  mockDb.reset();
});

describe('batchCreateGaragesAction', () => {
  it('rejects invalid payloads', async () => {
    const result = await batchCreateGaragesAction(
      initialState,
      form({ type: 'BIKE', quantity: '0', dailyRate: '10000' }),
    );

    expect(mocks.requireAdmin).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(false);
    expect(result.fieldErrors).toBeDefined();
    expect(mockDb.transaction).not.toHaveBeenCalled();
  });

  it('requires a kWh rate for EV bays', async () => {
    const result = await batchCreateGaragesAction(
      initialState,
      form({ type: 'EV', quantity: '2', dailyRate: '30000' }),
    );

    expect(result.success).toBe(false);
    expect(result.fieldErrors?.['kwhRate']).toBeDefined();
  });

  it('rejects batches that exceed the 999 bay cap', async () => {
    Garage.all.mockResolvedValueOnce([{ garage_code: 'S999' }]);

    const result = await batchCreateGaragesAction(
      initialState,
      form({ type: 'BIKE', quantity: '1', dailyRate: '10000' }),
    );

    expect(result.success).toBe(false);
    expect(mockDb.transaction).not.toHaveBeenCalled();
  });

  it('creates sequential bike bays without a kWh rate', async () => {
    Garage.all.mockResolvedValueOnce([{ garage_code: 'S001' }, { garage_code: 'S002' }]);

    const result = await batchCreateGaragesAction(
      initialState,
      form({ type: 'BIKE', quantity: '2', dailyRate: '10000', kwhRate: '999' }),
    );

    expect(Garage.create).toHaveBeenCalledTimes(2);
    expect(Garage.create).toHaveBeenNthCalledWith(1, {
      garage_code: 'S003',
      type: 'BIKE',
      daily_rate: 10_000,
      kwh_rate: null,
      status: 'AVAILABLE',
    });
    expect(Garage.create).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ garage_code: 'S004' }),
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/admin/garages');
    expect(result).toEqual({
      success: true,
      message: 'Created 2 bay(s): S003 to S004.',
      data: { createdCount: 2, firstCode: 'S003', lastCode: 'S004' },
    });
  });

  it('preserves the kWh rate for EV bays', async () => {
    Garage.all.mockResolvedValueOnce([]);

    const result = await batchCreateGaragesAction(
      initialState,
      form({ type: 'EV', quantity: '1', dailyRate: '30000', kwhRate: '2500' }),
    );

    expect(Garage.create).toHaveBeenCalledWith(
      expect.objectContaining({ garage_code: 'E001', type: 'EV', kwh_rate: 2500 }),
    );
    expect(result.success).toBe(true);
  });
});

describe('listGarages', () => {
  it('requires admin, syncs expired rentals, and maps rows', async () => {
    Garage.all.mockResolvedValueOnce([garageRow()]);

    const result = await listGarages();

    expect(mocks.requireAdmin).toHaveBeenCalledTimes(1);
    expect(mocks.syncExpiredRentals).toHaveBeenCalledTimes(1);
    expect(result).toEqual([
      {
        garageCode: 'S001',
        type: 'BIKE',
        dailyRate: 10_000,
        kwhRate: null,
        status: 'AVAILABLE',
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-01T00:00:00Z'),
      },
    ]);
  });

  it('filters by garage type', async () => {
    Garage.all.mockResolvedValueOnce([]);

    await listGarages('CAR');

    expect(Garage.where).toHaveBeenCalledWith({ type: 'CAR' });
  });
});

describe('listAvailableGaragesForToday', () => {
  it('requires a session and only queries AVAILABLE bays', async () => {
    Garage.all.mockResolvedValueOnce([garageRow()]);

    const result = await listAvailableGaragesForToday();

    expect(mocks.requireSessionUser).toHaveBeenCalledTimes(1);
    expect(mocks.syncExpiredRentals).toHaveBeenCalledTimes(1);
    expect(Garage.where).toHaveBeenCalledWith({ status: 'AVAILABLE' });
    expect(result).toHaveLength(1);
  });

  it('combines type and availability filters', async () => {
    Garage.all.mockResolvedValueOnce([]);

    await listAvailableGaragesForToday('EV');

    expect(Garage.where).toHaveBeenCalledWith({ type: 'EV', status: 'AVAILABLE' });
  });
});

describe('getMaxCodeSequenceByType', () => {
  it('returns the highest sequence number per category', async () => {
    Garage.all.mockResolvedValueOnce([
      { garage_code: 'S001', type: 'BIKE' },
      { garage_code: 'S007', type: 'BIKE' },
      { garage_code: 'C003', type: 'CAR' },
    ]);

    const result = await getMaxCodeSequenceByType();

    expect(mocks.requireAdmin).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ BIKE: 7, CAR: 3, EV: 0 });
  });
});

describe('getPublicFacilitySummary', () => {
  it('summarizes availability and starting rates per category', async () => {
    Garage.all.mockResolvedValueOnce([
      garageRow({ garage_code: 'S001', daily_rate: 12_000 }),
      garageRow({ garage_code: 'S002', daily_rate: 10_000, status: 'USED' }),
      garageRow({
        garage_code: 'E001',
        type: 'EV',
        daily_rate: 30_000,
        kwh_rate: 2500,
      }),
      garageRow({
        garage_code: 'E002',
        type: 'EV',
        daily_rate: 28_000,
        kwh_rate: 2000,
        status: 'USED',
      }),
    ]);

    const result = await getPublicFacilitySummary();

    expect(mocks.syncExpiredRentals).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(3);

    const bike = result.find((r) => r.type === 'BIKE');
    expect(bike).toMatchObject({
      totalCount: 2,
      availableCount: 1,
      usedCount: 1,
      minDailyRate: 10_000,
      minKwhRate: null,
    });
    expect(bike?.minMonthlyRate).toBeGreaterThan(10_000);

    const ev = result.find((r) => r.type === 'EV');
    expect(ev).toMatchObject({
      totalCount: 2,
      availableCount: 1,
      usedCount: 1,
      minDailyRate: 28_000,
      minKwhRate: 2000,
    });

    expect(result.find((r) => r.type === 'CAR')).toMatchObject({
      totalCount: 0,
      availableCount: 0,
      minDailyRate: null,
      minMonthlyRate: null,
      minKwhRate: null,
    });
  });
});
