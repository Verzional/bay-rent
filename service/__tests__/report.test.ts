import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RentalDetail } from '@/types';
import {
  getAdminDashboardOverview,
  getByGarageTypeReport,
  getByTenantReport,
  getDailyReport,
  getMonthlyReport,
} from '../report';

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  syncExpiredRentals: vi.fn(),
  fetchRentalDetails: vi.fn(),
  countPendingVerifications: vi.fn(),
  garageSelectAll: vi.fn(),
}));

vi.mock('@/lib/session', () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock('../auth', () => ({
  countPendingVerifications: mocks.countPendingVerifications,
}));
vi.mock('../rental', () => ({
  syncExpiredRentals: mocks.syncExpiredRentals,
  fetchRentalDetails: mocks.fetchRentalDetails,
}));
vi.mock('@/prisma/db', () => ({
  db: {
    orm: {
      public: {
        Garage: { select: () => ({ all: mocks.garageSelectAll }) },
      },
    },
  },
}));

function rental(overrides: Partial<RentalDetail> = {}): RentalDetail {
  return {
    rentalId: 1,
    garageCode: 'S001',
    garageType: 'BIKE',
    garageDailyRate: 10_000,
    garageKwhRate: null,
    garageStatus: 'USED',
    vehicleId: 1,
    vehicleType: 'BICYCLE',
    licensePlate: null,
    brandModel: 'Polygon',
    batteryKwh: null,
    tenantId: 5,
    tenantName: 'Budi Santoso',
    tenantEmail: 'budi@example.com',
    tenantNationalId: '3578012345678901',
    tenantPhone: '081234567890',
    rentalType: 'DAILY',
    daysCount: 2,
    startDate: new Date('2026-03-10T00:00:00Z'),
    endDate: new Date('2026-03-12T00:00:00Z'),
    totalCost: 20_000,
    extensionRevenueTotal: 0,
    grandTotalCost: 20_000,
    paymentProofUrl: '/api/uploads/a.png',
    status: 'ACTIVE',
    extensions: [],
    ...overrides,
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.fetchRentalDetails.mockResolvedValue([rental()]);
});

describe('getAdminDashboardOverview', () => {
  it('computes occupancy and pending verification KPIs', async () => {
    mocks.garageSelectAll.mockResolvedValueOnce([
      { status: 'AVAILABLE' },
      { status: 'USED' },
      { status: 'USED' },
      { status: 'USED' },
    ]);
    mocks.countPendingVerifications.mockResolvedValueOnce(3);

    const result = await getAdminDashboardOverview();

    expect(mocks.requireAdmin).toHaveBeenCalledTimes(1);
    expect(mocks.syncExpiredRentals).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      totalGarages: 4,
      availableGarages: 1,
      usedGarages: 3,
      occupancyRate: 75,
      pendingVerifications: 3,
    });
  });
});

describe('getMonthlyReport', () => {
  it('rejects out-of-range years', async () => {
    await expect(getMonthlyReport(1999)).rejects.toThrow();
    expect(mocks.requireAdmin).toHaveBeenCalledTimes(1);
    expect(mocks.fetchRentalDetails).not.toHaveBeenCalled();
  });

  it('returns a row per month for a valid year', async () => {
    const result = await getMonthlyReport(2026);

    expect(mocks.syncExpiredRentals).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(12);
  });
});

describe('getDailyReport', () => {
  it('rejects invalid months', async () => {
    await expect(getDailyReport(2026, 13)).rejects.toThrow();
    expect(mocks.requireAdmin).toHaveBeenCalledTimes(1);
    expect(mocks.fetchRentalDetails).not.toHaveBeenCalled();
  });

  it('returns a row per day of the selected month', async () => {
    const result = await getDailyReport(2026, 3);

    expect(result).toHaveLength(31);
  });
});

describe('getByGarageTypeReport', () => {
  it('groups rentals into BIKE, CAR, and EV rows', async () => {
    const result = await getByGarageTypeReport();

    expect(mocks.requireAdmin).toHaveBeenCalledTimes(1);
    expect(mocks.syncExpiredRentals).toHaveBeenCalledTimes(1);
    expect(result.map((r) => r.garageType).sort()).toEqual(['BIKE', 'CAR', 'EV']);
    expect(result.find((r) => r.garageType === 'BIKE')?.totalRentals).toBe(1);
  });
});

describe('getByTenantReport', () => {
  it('groups rentals per tenant', async () => {
    const result = await getByTenantReport();

    expect(mocks.requireAdmin).toHaveBeenCalledTimes(1);
    expect(mocks.syncExpiredRentals).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      tenantId: 5,
      fullName: 'Budi Santoso',
      totalRentals: 1,
      activeRentals: 1,
      totalSpend: 20_000,
    });
  });
});
