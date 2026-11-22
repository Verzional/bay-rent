import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/prisma/db';
import { DateCalculator } from '@/utils/date';
import {
  completeRentalAction,
  createRentalAction,
  extendRentalAction,
  fetchRentalDetails,
  listActiveRentalsToday,
  listTenantRentals,
  listTenantVehicles,
  syncExpiredRentals,
} from '../rental';
import type { MockDb } from './helpers/db-mock';

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  requireTenant: vi.fn(),
  savePaymentProof: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/session', () => ({
  requireAdmin: mocks.requireAdmin,
  requireTenant: mocks.requireTenant,
}));
vi.mock('@/lib/storage', () => ({ savePaymentProof: mocks.savePaymentProof }));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
}));
vi.mock('@/prisma/db', async () => {
  const { createDbMock } = await import('./helpers/db-mock');
  return { db: createDbMock() };
});

const mockDb = db as unknown as MockDb;
const { Garage, Rental, Vehicle, RentalExtension } = mockDb.models;

const initialState = { success: false, message: '' };
const DAY_MS = 86_400_000;

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function form(values: Record<string, string>, proof?: File | null): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  if (proof) data.set('paymentProof', proof);
  return data;
}

function proofFile(): File {
  return new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], 'proof.png', {
    type: 'image/png',
  });
}

function garageRow(overrides: Record<string, unknown> = {}) {
  return {
    garage_code: 'S001',
    type: 'BIKE',
    daily_rate: 10_000,
    kwh_rate: null,
    status: 'AVAILABLE',
    ...overrides,
  };
}

const tenantSession = {
  userId: 5,
  email: 'budi@example.com',
  fullName: 'Budi Santoso',
  role: 'TENANT',
  verificationStatus: 'ACCEPTED',
};

const newBikeBooking = {
  vehicleMode: 'new',
  newVehicleType: 'BICYCLE',
  brandModel: 'Polygon Xtrada',
  licensePlate: '',
  garageCode: 'S001',
  rentalType: 'DAILY',
  daysCount: '3',
};

beforeEach(() => {
  vi.resetAllMocks();
  mockDb.reset();
  mocks.requireTenant.mockResolvedValue(tenantSession);
  mocks.requireAdmin.mockResolvedValue({ userId: 1, role: 'ADMIN' });
  mocks.savePaymentProof.mockResolvedValue('/api/uploads/proof.png');
  Rental.all.mockResolvedValue([]);
});

describe('syncExpiredRentals', () => {
  it('returns 0 and skips the transaction when nothing expired', async () => {
    Rental.all.mockResolvedValueOnce([]);

    await expect(syncExpiredRentals()).resolves.toBe(0);
    expect(mockDb.transaction).not.toHaveBeenCalled();
  });

  it('completes expired rentals and releases their garages once each', async () => {
    Rental.all.mockResolvedValueOnce([
      { rental_id: 1, garage_code: 'S001' },
      { rental_id: 2, garage_code: 'S001' },
      { rental_id: 3, garage_code: 'C002' },
    ]);

    await expect(syncExpiredRentals()).resolves.toBe(3);

    expect(mockDb.transaction).toHaveBeenCalledTimes(1);
    expect(Rental.updateAll).toHaveBeenCalledWith({ status: 'COMPLETED' });
    expect(Garage.updateAll).toHaveBeenCalledWith({ status: 'AVAILABLE' });
  });
});

describe('fetchRentalDetails', () => {
  it('returns an empty list for an empty vehicle id filter without querying', async () => {
    await expect(fetchRentalDetails({ vehicleIds: [] })).resolves.toEqual([]);
    expect(Rental.include).not.toHaveBeenCalled();
  });

  it('hydrates rentals with extension revenue totals', async () => {
    const start = new Date('2026-03-10T00:00:00Z');
    const end = new Date('2026-03-15T00:00:00Z');
    Rental.all.mockResolvedValueOnce([
      {
        rental_id: 9,
        garage_code: 'S001',
        garage: { type: 'BIKE', daily_rate: 10_000, kwh_rate: null, status: 'USED' },
        vehicle: {
          vehicle_id: 4,
          type: 'BICYCLE',
          license_plate: null,
          brand_model: 'Polygon',
          battery_kwh: null,
          tenant: {
            user_id: 5,
            full_name: 'Budi Santoso',
            email: 'budi@example.com',
            national_id: '3578012345678901',
            phone_number: '081234567890',
          },
        },
        rental_type: 'DAILY',
        days_count: 2,
        start_date: start,
        end_date: end,
        total_cost: 20_000,
        payment_proof_url: '/api/uploads/a.png',
        status: 'ACTIVE',
        extensions: [
          {
            extension_id: 1,
            rental_id: 9,
            admin_id: 1,
            previous_end_date: new Date('2026-03-12T00:00:00Z'),
            new_end_date: end,
            remaining_cost: 30_000,
            payment_proof_url: '/api/uploads/b.png',
            created_at: new Date('2026-03-12T00:00:00Z'),
          },
        ],
      },
    ]);

    const [detail] = await fetchRentalDetails();

    expect(detail).toMatchObject({
      rentalId: 9,
      garageCode: 'S001',
      tenantId: 5,
      totalCost: 20_000,
      extensionRevenueTotal: 30_000,
      grandTotalCost: 50_000,
      status: 'ACTIVE',
    });
    expect(detail?.extensions).toHaveLength(1);
  });

  it('throws when a rental is missing its vehicle relation', async () => {
    Rental.all.mockResolvedValueOnce([
      { rental_id: 9, garage: garageRow(), vehicle: null, extensions: [] },
    ]);

    await expect(fetchRentalDetails()).rejects.toThrow(/missing required vehicle/);
  });
});

describe('tenant and admin listings', () => {
  it('lists tenant vehicles scoped to the signed-in tenant', async () => {
    Vehicle.all.mockResolvedValueOnce([
      {
        vehicle_id: 4,
        tenant_id: 5,
        type: 'CAR',
        license_plate: 'L 1367 DR',
        brand_model: 'Honda Civic RS',
        battery_kwh: null,
        created_at: new Date('2026-01-01T00:00:00Z'),
      },
    ]);

    const result = await listTenantVehicles();

    expect(mocks.requireTenant).toHaveBeenCalledTimes(1);
    expect(Vehicle.where).toHaveBeenCalledWith({ tenant_id: 5 });
    expect(result).toEqual([
      {
        vehicleId: 4,
        tenantId: 5,
        type: 'CAR',
        licensePlate: 'L 1367 DR',
        brandModel: 'Honda Civic RS',
        batteryKwh: null,
        createdAt: new Date('2026-01-01T00:00:00Z'),
      },
    ]);
  });

  it('lists tenant rentals only for the tenant vehicles', async () => {
    Vehicle.all.mockResolvedValueOnce([{ vehicle_id: 4 }]);

    await expect(listTenantRentals()).resolves.toEqual([]);

    expect(mocks.requireTenant).toHaveBeenCalledTimes(1);
    expect(Vehicle.where).toHaveBeenCalledWith({ tenant_id: 5 });
  });

  it('lists active rentals for admins', async () => {
    await expect(listActiveRentalsToday()).resolves.toEqual([]);

    expect(mocks.requireAdmin).toHaveBeenCalledTimes(1);
  });
});

describe('createRentalAction', () => {
  it('blocks tenants that are not verified', async () => {
    mocks.requireTenant.mockResolvedValue({
      ...tenantSession,
      verificationStatus: 'PENDING',
    });

    const result = await createRentalAction(
      initialState,
      form(newBikeBooking, proofFile()),
    );

    expect(result).toEqual({
      success: false,
      message: 'Your account must be verified by an administrator before renting.',
    });
  });

  it('rejects schema violations', async () => {
    const result = await createRentalAction(
      initialState,
      form({ ...newBikeBooking, garageCode: 'X1' }, proofFile()),
    );

    expect(result.success).toBe(false);
    expect(result.fieldErrors).toBeDefined();
  });

  it('rejects an existing vehicle that does not exist', async () => {
    Vehicle.first.mockResolvedValueOnce(null);

    const result = await createRentalAction(
      initialState,
      form(
        {
          vehicleMode: 'existing',
          existingVehicleId: '10',
          garageCode: 'S001',
          rentalType: 'DAILY',
          daysCount: '3',
        },
        proofFile(),
      ),
    );

    expect(result).toEqual({
      success: false,
      message: 'Selected vehicle was not found in your account.',
    });
  });

  it("rejects another tenant's vehicle", async () => {
    Vehicle.first.mockResolvedValueOnce({
      vehicle_id: 10,
      tenant_id: 99,
      type: 'BICYCLE',
      battery_kwh: null,
    });

    const result = await createRentalAction(
      initialState,
      form(
        {
          vehicleMode: 'existing',
          existingVehicleId: '10',
          garageCode: 'S001',
          rentalType: 'DAILY',
          daysCount: '3',
        },
        proofFile(),
      ),
    );

    expect(result.message).toBe('Selected vehicle was not found in your account.');
  });

  it('rejects a vehicle that is already parked in an active bay', async () => {
    Vehicle.first.mockResolvedValueOnce({
      vehicle_id: 10,
      tenant_id: 5,
      type: 'BICYCLE',
      battery_kwh: null,
    });
    Rental.first.mockResolvedValueOnce({ garage_code: 'S009' });

    const result = await createRentalAction(
      initialState,
      form(
        {
          vehicleMode: 'existing',
          existingVehicleId: '10',
          garageCode: 'S001',
          rentalType: 'DAILY',
          daysCount: '3',
        },
        proofFile(),
      ),
    );

    expect(result).toEqual({
      success: false,
      message: 'This vehicle is already parked in active bay S009.',
    });
  });

  it('rejects a duplicate license plate on a new vehicle', async () => {
    Vehicle.first.mockResolvedValueOnce({ vehicle_id: 77 });

    const result = await createRentalAction(
      initialState,
      form(
        {
          ...newBikeBooking,
          newVehicleType: 'CAR',
          licensePlate: 'l 1367 dr',
          garageCode: 'C001',
        },
        proofFile(),
      ),
    );

    expect(result.success).toBe(false);
    expect(result.fieldErrors?.['newVehicle.licensePlate']).toBeDefined();
  });

  it('rejects a garage that does not exist', async () => {
    Garage.first.mockResolvedValueOnce(null);

    const result = await createRentalAction(
      initialState,
      form(newBikeBooking, proofFile()),
    );

    expect(result).toEqual({
      success: false,
      message: 'Garage bay S001 does not exist.',
    });
  });

  it('rejects an occupied garage', async () => {
    Garage.first.mockResolvedValueOnce(garageRow({ status: 'USED' }));

    const result = await createRentalAction(
      initialState,
      form(newBikeBooking, proofFile()),
    );

    expect(result).toEqual({
      success: false,
      message: 'Garage bay S001 is currently occupied.',
    });
  });

  it('rejects vehicles incompatible with the garage type', async () => {
    Vehicle.first.mockResolvedValueOnce(null);
    Garage.first.mockResolvedValueOnce(garageRow());

    const result = await createRentalAction(
      initialState,
      form(
        { ...newBikeBooking, newVehicleType: 'CAR', licensePlate: 'L 1367 DR' },
        proofFile(),
      ),
    );

    expect(result.success).toBe(false);
    expect(mocks.savePaymentProof).not.toHaveBeenCalled();
  });

  it('requires a payment proof file', async () => {
    Garage.first.mockResolvedValueOnce(garageRow());

    const result = await createRentalAction(initialState, form(newBikeBooking));

    expect(result.success).toBe(false);
    expect(result.fieldErrors?.['paymentProof']).toBeDefined();
    expect(mocks.savePaymentProof).not.toHaveBeenCalled();
  });

  it('surfaces payment proof storage failures', async () => {
    Garage.first.mockResolvedValueOnce(garageRow());
    mocks.savePaymentProof.mockRejectedValueOnce(new Error('Unsupported image type.'));

    const result = await createRentalAction(
      initialState,
      form(newBikeBooking, proofFile()),
    );

    expect(result).toMatchObject({
      success: false,
      message: 'Unsupported image type.',
      fieldErrors: { paymentProof: ['Unsupported image type.'] },
    });
  });

  it('reports a garage taken by a concurrent booking', async () => {
    Garage.first
      .mockResolvedValueOnce(garageRow())
      .mockResolvedValueOnce(garageRow({ status: 'USED' }));

    const result = await createRentalAction(
      initialState,
      form(newBikeBooking, proofFile()),
    );

    expect(result).toEqual({
      success: false,
      message: 'Garage bay S001 is no longer available.',
    });
    expect(Rental.create).not.toHaveBeenCalled();
  });

  it('books a bay, marks it USED, and redirects to /tenant', async () => {
    Garage.first.mockResolvedValue(garageRow());
    Vehicle.create.mockResolvedValueOnce({ vehicle_id: 11 });

    await expect(
      createRentalAction(initialState, form(newBikeBooking, proofFile())),
    ).rejects.toThrow('NEXT_REDIRECT:/tenant');

    expect(Vehicle.create).toHaveBeenCalledWith(
      expect.objectContaining({ tenant_id: 5, type: 'BICYCLE', license_plate: null }),
    );
    expect(Rental.create).toHaveBeenCalledWith(
      expect.objectContaining({
        garage_code: 'S001',
        vehicle_id: 11,
        rental_type: 'DAILY',
        days_count: 3,
        payment_proof_url: '/api/uploads/proof.png',
        status: 'ACTIVE',
      }),
    );
    expect(Garage.update).toHaveBeenCalledWith({ status: 'USED' });
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/tenant');
  });
});

describe('extendRentalAction', () => {
  const today = DateCalculator.today();
  const currentEnd = addDays(today, 2);

  function activeRental(overrides: Record<string, unknown> = {}) {
    return {
      rental_id: 3,
      garage_code: 'S001',
      status: 'ACTIVE',
      end_date: currentEnd,
      garage: { type: 'BIKE', daily_rate: 10_000, kwh_rate: null },
      vehicle: { type: 'BICYCLE', battery_kwh: null },
      ...overrides,
    };
  }

  it('rejects invalid payloads', async () => {
    const result = await extendRentalAction(
      initialState,
      form({ rentalId: '0', newEndDate: 'tomorrow' }, proofFile()),
    );

    expect(mocks.requireAdmin).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(false);
    expect(result.fieldErrors).toBeDefined();
  });

  it('rejects a missing rental', async () => {
    Rental.first.mockResolvedValueOnce(null);

    const result = await extendRentalAction(
      initialState,
      form({ rentalId: '3', newEndDate: isoDate(addDays(today, 4)) }, proofFile()),
    );

    expect(result).toEqual({ success: false, message: 'Rental record not found.' });
  });

  it('rejects completed rentals', async () => {
    Rental.first.mockResolvedValueOnce(activeRental({ status: 'COMPLETED' }));

    const result = await extendRentalAction(
      initialState,
      form({ rentalId: '3', newEndDate: isoDate(addDays(today, 4)) }, proofFile()),
    );

    expect(result).toEqual({
      success: false,
      message: 'Only active rentals can be extended.',
    });
  });

  it('rejects an end date that is not after the current end date', async () => {
    Rental.first.mockResolvedValueOnce(activeRental());

    const result = await extendRentalAction(
      initialState,
      form({ rentalId: '3', newEndDate: isoDate(currentEnd) }, proofFile()),
    );

    expect(result.success).toBe(false);
    expect(RentalExtension.create).not.toHaveBeenCalled();
  });

  it('requires an extension payment proof', async () => {
    Rental.first.mockResolvedValueOnce(activeRental());

    const result = await extendRentalAction(
      initialState,
      form({ rentalId: '3', newEndDate: isoDate(addDays(today, 4)) }),
    );

    expect(result.success).toBe(false);
    expect(result.fieldErrors?.['paymentProof']).toBeDefined();
    expect(RentalExtension.create).not.toHaveBeenCalled();
  });

  it('records the extension and moves the rental end date', async () => {
    Rental.first.mockResolvedValueOnce(activeRental());

    const result = await extendRentalAction(
      initialState,
      form({ rentalId: '3', newEndDate: isoDate(addDays(today, 4)) }, proofFile()),
    );

    expect(RentalExtension.create).toHaveBeenCalledWith(
      expect.objectContaining({
        rental_id: 3,
        admin_id: 1,
        previous_end_date: currentEnd,
        payment_proof_url: '/api/uploads/proof.png',
      }),
    );
    expect(Rental.update).toHaveBeenCalledWith({ end_date: expect.any(Date) });
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/admin/rentals');
    expect(result.success).toBe(true);
  });
});

describe('completeRentalAction', () => {
  it('rejects a missing rental', async () => {
    Rental.first.mockResolvedValueOnce(null);

    const result = await completeRentalAction(3);

    expect(mocks.requireAdmin).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ success: false, message: 'Rental record not found.' });
  });

  it('rejects an already completed rental', async () => {
    Rental.first.mockResolvedValueOnce({
      rental_id: 3,
      garage_code: 'S001',
      status: 'COMPLETED',
    });

    const result = await completeRentalAction(3);

    expect(result).toEqual({ success: false, message: 'Rental is already completed.' });
    expect(mockDb.transaction).not.toHaveBeenCalled();
  });

  it('completes the rental and releases the garage bay', async () => {
    Rental.first.mockResolvedValueOnce({
      rental_id: 3,
      garage_code: 'S001',
      status: 'ACTIVE',
    });

    const result = await completeRentalAction(3);

    expect(Rental.update).toHaveBeenCalledWith({ status: 'COMPLETED' });
    expect(Garage.update).toHaveBeenCalledWith({ status: 'AVAILABLE' });
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/admin/rentals');
    expect(result).toEqual({
      success: true,
      message: 'Rental marked as completed and garage bay released.',
    });
  });
});
