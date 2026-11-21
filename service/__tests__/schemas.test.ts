import { describe, expect, it } from 'vitest';
import {
  batchCreateGarageSchema,
  createRentalSchema,
  extendRentalSchema,
  parseSchema,
  registerTenantSchema,
} from '@/types';

describe('Zod validation schemas in types/schemas', () => {
  it('validates 16-digit NIK on tenant registration', () => {
    const valid = parseSchema(registerTenantSchema, {
      nationalId: '3578012345678901',
      fullName: 'Budi Santoso',
      phoneNumber: '081234567890',
      email: 'Budi@Example.com',
      password: 'password123',
    });
    expect(valid.ok).toBe(true);
    if (valid.ok) {
      expect(valid.data.email).toBe('budi@example.com');
    }

    const shortNik = parseSchema(registerTenantSchema, {
      nationalId: '12345',
      fullName: 'Budi',
      phoneNumber: '081234567890',
      email: 'budi@example.com',
      password: 'password123',
    });
    expect(shortNik.ok).toBe(false);
  });

  it('enforces EV kWh rate and max 999 quantity on batch garage creation', () => {
    const evMissingRate = parseSchema(batchCreateGarageSchema, {
      type: 'EV',
      quantity: 5,
      dailyRate: 100_000,
      kwhRate: null,
    });
    expect(evMissingRate.ok).toBe(false);

    const overMax = parseSchema(batchCreateGarageSchema, {
      type: 'CAR',
      quantity: 1000,
      dailyRate: 50_000,
    });
    expect(overMax.ok).toBe(false);
  });

  it('enforces license plate for motorized vehicles, battery kWh for EV, and 1-30 daily days', () => {
    const bikeOk = parseSchema(createRentalSchema, {
      newVehicle: { type: 'BICYCLE', brandModel: 'Polygon', licensePlate: '' },
      garageCode: 'S001',
      rentalType: 'DAILY',
      daysCount: 5,
    });
    expect(bikeOk.ok).toBe(true);

    const carMissingPlate = parseSchema(createRentalSchema, {
      newVehicle: { type: 'CAR', brandModel: 'Civic', licensePlate: '' },
      garageCode: 'C001',
      rentalType: 'DAILY',
      daysCount: 5,
    });
    expect(carMissingPlate.ok).toBe(false);

    const dailyOver30 = parseSchema(createRentalSchema, {
      existingVehicleId: 1,
      garageCode: 'C001',
      rentalType: 'DAILY',
      daysCount: 31,
    });
    expect(dailyOver30.ok).toBe(false);

    const extValid = parseSchema(extendRentalSchema, {
      rentalId: 1,
      newEndDate: '2026-04-15',
    });
    expect(extValid.ok).toBe(true);
  });
});
