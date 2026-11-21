'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin, requireTenant } from '@/lib/session';
import { savePaymentProof } from '@/lib/storage';
import { db } from '@/prisma/db';
import {
  type ActionState,
  createRentalSchema,
  extendRentalSchema,
  parseSchema,
  type RentalDetail,
  type RentalType,
  type VehicleItem,
  type VehicleType,
} from '@/types';
import { DateCalculator } from '@/utils/date';
import { PricingStrategyFactory } from './pricing';

/**
 * Auto-completes active rentals whose `end_date` is strictly before today
 * and frees their assigned garages back to `AVAILABLE`.
 */
export async function syncExpiredRentals(now: Date = new Date()): Promise<number> {
  const today = DateCalculator.today(now);
  const expired = await db.orm.public.Rental.where((r) => r.status.eq('ACTIVE'))
    .where((r) => r.end_date.lt(today))
    .all();

  if (expired.length === 0) {
    return 0;
  }

  const rentalIds = expired.map((r) => r.rental_id);
  const garageCodes = Array.from(new Set(expired.map((r) => r.garage_code)));

  await db.transaction(async (tx) => {
    await tx.orm.public.Rental.where((r) => r.rental_id.in(rentalIds)).updateAll({
      status: 'COMPLETED',
    });
    await tx.orm.public.Garage.where((g) => g.garage_code.in(garageCodes)).updateAll({
      status: 'AVAILABLE',
    });
  });

  return expired.length;
}

/**
 * Hydrates and fetches all rentals matching optional vehicle IDs or status filter.
 */
export async function fetchRentalDetails(options?: {
  status?: 'ACTIVE' | 'COMPLETED';
  vehicleIds?: number[];
}): Promise<RentalDetail[]> {
  if (options?.vehicleIds && options.vehicleIds.length === 0) {
    return [];
  }

  let query = db.orm.public.Rental.include('garage')
    .include('vehicle', (vehicle) => vehicle.include('tenant'))
    .include('extensions', (ext) => ext.orderBy((e) => e.created_at.desc()));

  if (options?.status) {
    const status = options.status;
    query = query.where((r) => r.status.eq(status));
  }
  if (options?.vehicleIds) {
    const ids = options.vehicleIds;
    query = query.where((r) => r.vehicle_id.in(ids));
  }

  const rows = await query.orderBy((r) => r.rental_id.desc()).all();

  return rows.map((row) => {
    if (!row.vehicle) {
      throw new Error(`Rental ${row.rental_id} is missing required vehicle relation.`);
    }

    const extensionRevenueTotal = row.extensions.reduce(
      (sum, ext) => sum + ext.remaining_cost,
      0,
    );

    return {
      rentalId: row.rental_id,
      garageCode: row.garage_code,
      garageType: row.garage.type,
      garageDailyRate: row.garage.daily_rate,
      garageKwhRate: row.garage.kwh_rate,
      garageStatus: row.garage.status,
      vehicleId: row.vehicle.vehicle_id,
      vehicleType: row.vehicle.type,
      licensePlate: row.vehicle.license_plate,
      brandModel: row.vehicle.brand_model,
      batteryKwh: row.vehicle.battery_kwh,
      tenantId: row.vehicle.tenant.user_id,
      tenantName: row.vehicle.tenant.full_name,
      tenantEmail: row.vehicle.tenant.email,
      tenantNationalId: row.vehicle.tenant.national_id,
      tenantPhone: row.vehicle.tenant.phone_number,
      rentalType: row.rental_type,
      daysCount: row.days_count,
      startDate: row.start_date,
      endDate: row.end_date,
      totalCost: row.total_cost,
      extensionRevenueTotal,
      grandTotalCost: row.total_cost + extensionRevenueTotal,
      paymentProofUrl: row.payment_proof_url,
      status: row.status,
      extensions: row.extensions.map((ext) => ({
        extensionId: ext.extension_id,
        rentalId: ext.rental_id,
        adminId: ext.admin_id,
        previousEndDate: ext.previous_end_date,
        newEndDate: ext.new_end_date,
        remainingCost: ext.remaining_cost,
        paymentProofUrl: ext.payment_proof_url,
        createdAt: ext.created_at,
      })),
    };
  });
}

/**
 * Lists vehicles registered to the authenticated tenant.
 */
export async function listTenantVehicles(): Promise<VehicleItem[]> {
  const tenant = await requireTenant();
  const rows = await db.orm.public.Vehicle.where({ tenant_id: tenant.userId })
    .orderBy((v) => v.created_at.desc())
    .all();

  return rows.map((v) => ({
    vehicleId: v.vehicle_id,
    tenantId: v.tenant_id,
    type: v.type,
    licensePlate: v.license_plate,
    brandModel: v.brand_model,
    batteryKwh: v.battery_kwh,
    createdAt: v.created_at,
  }));
}

/**
 * Lists all rentals owned by the authenticated tenant after syncing expired rentals.
 */
export async function listTenantRentals(): Promise<RentalDetail[]> {
  const tenant = await requireTenant();
  await syncExpiredRentals();

  const vehicles = await db.orm.public.Vehicle.where({ tenant_id: tenant.userId })
    .select('vehicle_id')
    .all();
  return fetchRentalDetails({ vehicleIds: vehicles.map((v) => v.vehicle_id) });
}

/**
 * Lists all garages currently rented today for Admin management.
 */
export async function listActiveRentalsToday(): Promise<RentalDetail[]> {
  await requireAdmin();
  await syncExpiredRentals();
  return fetchRentalDetails({ status: 'ACTIVE' });
}

/**
 * Books a new garage bay for an `ACCEPTED` tenant, atomically saving vehicle + rental
 * and marking the bay `USED`.
 */
export async function createRentalAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const tenant = await requireTenant();
  if (tenant.verificationStatus !== 'ACCEPTED') {
    return {
      success: false,
      message: 'Your account must be verified by an administrator before renting.',
    };
  }

  const vehicleMode = String(formData.get('vehicleMode') ?? 'new');
  const rawInput: Record<string, unknown> = {
    garageCode: String(formData.get('garageCode') ?? ''),
    rentalType: String(formData.get('rentalType') ?? 'DAILY') as RentalType,
    daysCount:
      formData.get('daysCount') && String(formData.get('daysCount')).trim() !== ''
        ? Number(formData.get('daysCount'))
        : null,
  };

  if (vehicleMode === 'existing') {
    rawInput['existingVehicleId'] = Number(formData.get('existingVehicleId') ?? 0);
  } else {
    const rawBattery = formData.get('batteryKwh');
    rawInput['newVehicle'] = {
      type: String(formData.get('newVehicleType') ?? '') as VehicleType,
      licensePlate: String(formData.get('licensePlate') ?? ''),
      brandModel: String(formData.get('brandModel') ?? ''),
      batteryKwh:
        rawBattery && String(rawBattery).trim() !== '' ? Number(rawBattery) : null,
    };
  }

  const parsed = parseSchema(createRentalSchema, rawInput);
  if (!parsed.ok) {
    return {
      success: false,
      message: parsed.message,
      fieldErrors: parsed.fieldErrors,
    };
  }

  await syncExpiredRentals();

  let vehicleType: VehicleType;
  let batteryKwh: number | null;
  let existingVehicleId: number | undefined;
  let newVehicleData:
    | {
        tenant_id: number;
        type: VehicleType;
        license_plate: string | null;
        brand_model: string;
        battery_kwh: number | null;
      }
    | undefined;

  if (parsed.data.existingVehicleId) {
    const existingVehicle = await db.orm.public.Vehicle.where({
      vehicle_id: parsed.data.existingVehicleId,
    }).first();

    if (!existingVehicle || existingVehicle.tenant_id !== tenant.userId) {
      return {
        success: false,
        message: 'Selected vehicle was not found in your account.',
      };
    }

    const activeBooking = await db.orm.public.Rental.where({
      vehicle_id: existingVehicle.vehicle_id,
      status: 'ACTIVE',
    }).first();
    if (activeBooking) {
      return {
        success: false,
        message: `This vehicle is already parked in active bay ${activeBooking.garage_code}.`,
      };
    }

    existingVehicleId = existingVehicle.vehicle_id;
    vehicleType = existingVehicle.type;
    batteryKwh = existingVehicle.battery_kwh;
  } else if (parsed.data.newVehicle) {
    const plate = parsed.data.newVehicle.licensePlate ?? null;
    if (plate) {
      const duplicate = await db.orm.public.Vehicle.where({
        license_plate: plate,
      }).first();
      if (duplicate) {
        return {
          success: false,
          message: `License plate ${plate} is already registered. Select it from your saved vehicles if it belongs to you.`,
          fieldErrors: {
            'newVehicle.licensePlate': [`License plate ${plate} is already registered.`],
          },
        };
      }
    }

    vehicleType = parsed.data.newVehicle.type;
    batteryKwh =
      parsed.data.newVehicle.type === 'EV'
        ? (parsed.data.newVehicle.batteryKwh ?? null)
        : null;
    newVehicleData = {
      tenant_id: tenant.userId,
      type: vehicleType,
      license_plate: plate,
      brand_model: parsed.data.newVehicle.brandModel,
      battery_kwh: batteryKwh,
    };
  } else {
    return { success: false, message: 'Vehicle details are required.' };
  }

  const garage = await db.orm.public.Garage.where({
    garage_code: parsed.data.garageCode,
  }).first();
  if (!garage) {
    return {
      success: false,
      message: `Garage bay ${parsed.data.garageCode} does not exist.`,
    };
  }
  if (garage.status !== 'AVAILABLE') {
    return {
      success: false,
      message: `Garage bay ${garage.garage_code} is currently occupied.`,
    };
  }

  let endDate: Date;
  let totalCost: number;
  const startDate = DateCalculator.today();

  try {
    const pricing = PricingStrategyFactory.getStrategy(
      garage.type,
    ).calculateInitialRentalCost({
      startDate,
      rentalType: parsed.data.rentalType,
      daysCount: parsed.data.daysCount,
      dailyRate: garage.daily_rate,
      kwhRate: garage.kwh_rate,
      vehicleType,
      batteryKwh,
    });
    endDate = pricing.endDate;
    totalCost = pricing.totalCost;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Invalid booking configuration.',
    };
  }

  let paymentProofUrl: string;
  try {
    const proofEntry = formData.get('paymentProof');
    if (!(proofEntry instanceof File)) {
      throw new Error('Please upload a payment proof image.');
    }
    paymentProofUrl = await savePaymentProof(proofEntry);
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Invalid payment proof.',
      fieldErrors: {
        paymentProof: [
          error instanceof Error ? error.message : 'Invalid payment proof.',
        ],
      },
    };
  }

  try {
    await db.transaction(async (tx) => {
      const lockedGarage = await tx.orm.public.Garage.where({
        garage_code: garage.garage_code,
      })
        .forUpdate()
        .first();

      if (!lockedGarage || lockedGarage.status !== 'AVAILABLE') {
        throw new Error(`GARAGE_UNAVAILABLE:${garage.garage_code}`);
      }

      let vehicleId = existingVehicleId;
      if (!vehicleId && newVehicleData) {
        const createdVehicle = await tx.orm.public.Vehicle.create(newVehicleData);
        vehicleId = createdVehicle.vehicle_id;
      }

      await tx.orm.public.Rental.create({
        garage_code: garage.garage_code,
        vehicle_id: vehicleId!,
        rental_type: parsed.data.rentalType,
        days_count:
          parsed.data.rentalType === 'DAILY' ? (parsed.data.daysCount ?? null) : null,
        start_date: startDate,
        end_date: endDate,
        total_cost: totalCost,
        payment_proof_url: paymentProofUrl,
        status: 'ACTIVE',
      });

      await tx.orm.public.Garage.where({ garage_code: garage.garage_code }).update({
        status: 'USED',
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('GARAGE_UNAVAILABLE:')) {
      return {
        success: false,
        message: `Garage bay ${garage.garage_code} is no longer available.`,
      };
    }
    throw error;
  }

  revalidatePath('/');
  revalidatePath('/tenant');
  revalidatePath('/tenant/rent');
  revalidatePath('/admin');
  revalidatePath('/admin/garages');
  revalidatePath('/admin/rentals');
  revalidatePath('/admin/reports');

  redirect('/tenant');
}

/**
 * Extends an active rental's end date, calculates remaining cost using unified rules,
 * records a `RentalExtension`, and updates the rental.
 */
export async function extendRentalAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();

  const parsed = parseSchema(extendRentalSchema, {
    rentalId: Number(formData.get('rentalId') ?? 0),
    newEndDate: String(formData.get('newEndDate') ?? ''),
  });

  if (!parsed.ok) {
    return {
      success: false,
      message: parsed.message,
      fieldErrors: parsed.fieldErrors,
    };
  }

  await syncExpiredRentals();

  const rental = await db.orm.public.Rental.where({ rental_id: parsed.data.rentalId })
    .include('garage')
    .include('vehicle')
    .first();

  if (!rental || !rental.vehicle) {
    return { success: false, message: 'Rental record not found.' };
  }
  if (rental.status !== 'ACTIVE') {
    return { success: false, message: 'Only active rentals can be extended.' };
  }

  let newEndDate: Date;
  let remainingCost: number;
  try {
    const parsedDate = DateCalculator.parseIsoDate(parsed.data.newEndDate);
    const pricing = PricingStrategyFactory.getStrategy(
      rental.garage.type,
    ).calculateExtensionCost({
      previousEndDate: rental.end_date,
      newEndDate: parsedDate,
      dailyRate: rental.garage.daily_rate,
      kwhRate: rental.garage.kwh_rate,
      vehicleType: rental.vehicle.type,
      batteryKwh: rental.vehicle.battery_kwh,
    });
    newEndDate = pricing.newEndDate;
    remainingCost = pricing.remainingCost;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Invalid extension end date.',
    };
  }

  let paymentProofUrl: string;
  try {
    const proofEntry = formData.get('paymentProof');
    if (!(proofEntry instanceof File)) {
      throw new Error('Please upload an extension payment proof image.');
    }
    paymentProofUrl = await savePaymentProof(proofEntry);
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Invalid payment proof.',
      fieldErrors: {
        paymentProof: [
          error instanceof Error ? error.message : 'Invalid payment proof.',
        ],
      },
    };
  }

  await db.transaction(async (tx) => {
    await tx.orm.public.RentalExtension.create({
      rental_id: rental.rental_id,
      admin_id: admin.userId,
      previous_end_date: rental.end_date,
      new_end_date: newEndDate,
      remaining_cost: remainingCost,
      payment_proof_url: paymentProofUrl,
    });

    await tx.orm.public.Rental.where({ rental_id: rental.rental_id }).update({
      end_date: newEndDate,
    });
  });

  revalidatePath('/admin');
  revalidatePath('/admin/rentals');
  revalidatePath('/admin/reports');
  revalidatePath('/tenant');

  return {
    success: true,
    message: `Extended bay ${rental.garage_code} until ${parsed.data.newEndDate}.`,
  };
}

/**
 * Manually marks an active rental as completed and releases its garage bay.
 */
export async function completeRentalAction(rentalId: number): Promise<ActionState> {
  await requireAdmin();

  const rental = await db.orm.public.Rental.where({ rental_id: rentalId }).first();
  if (!rental) {
    return { success: false, message: 'Rental record not found.' };
  }
  if (rental.status !== 'ACTIVE') {
    return { success: false, message: 'Rental is already completed.' };
  }

  await db.transaction(async (tx) => {
    await tx.orm.public.Rental.where({ rental_id: rental.rental_id }).update({
      status: 'COMPLETED',
    });
    await tx.orm.public.Garage.where({ garage_code: rental.garage_code }).update({
      status: 'AVAILABLE',
    });
  });

  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/admin/garages');
  revalidatePath('/admin/rentals');
  revalidatePath('/admin/reports');
  revalidatePath('/tenant');
  revalidatePath('/tenant/rent');

  return {
    success: true,
    message: 'Rental marked as completed and garage bay released.',
  };
}
