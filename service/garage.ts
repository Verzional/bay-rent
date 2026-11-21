'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin, requireSessionUser } from '@/lib/session';
import { db } from '@/prisma/db';
import {
  type ActionState,
  batchCreateGarageSchema,
  type BatchCreateGarageResult,
  type GarageItem,
  type GarageSummaryByType,
  type GarageType,
  parseSchema,
} from '@/types';
import { GarageCodeGenerator } from './garage-code';
import { MONTHLY_RATE_MULTIPLIER } from './pricing';
import { syncExpiredRentals } from './rental';

/**
 * Batch-creates sequential garage bays (`S###`, `C###`, `E###`) up to 999 per category.
 */
export async function batchCreateGaragesAction(
  _prevState: ActionState<BatchCreateGarageResult>,
  formData: FormData,
): Promise<ActionState<BatchCreateGarageResult>> {
  await requireAdmin();

  const rawKwh = formData.get('kwhRate');
  const parsed = parseSchema(batchCreateGarageSchema, {
    type: String(formData.get('type') ?? ''),
    quantity: Number(formData.get('quantity') ?? 0),
    dailyRate: Number(formData.get('dailyRate') ?? 0),
    kwhRate: rawKwh !== null && String(rawKwh).trim() !== '' ? Number(rawKwh) : null,
  });

  if (!parsed.ok) {
    return {
      success: false,
      message: parsed.message,
      fieldErrors: parsed.fieldErrors,
    };
  }

  const existingRows = await db.orm.public.Garage.where({ type: parsed.data.type })
    .select('garage_code')
    .all();

  let nextCodes: string[];
  try {
    nextCodes = GarageCodeGenerator.generateNextCodes(
      parsed.data.type,
      existingRows.map((r) => r.garage_code),
      parsed.data.quantity,
    );
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unable to generate bay codes.',
    };
  }

  const kwhRate = parsed.data.type === 'EV' ? (parsed.data.kwhRate ?? null) : null;

  await db.transaction(async (tx) => {
    for (const code of nextCodes) {
      await tx.orm.public.Garage.create({
        garage_code: code,
        type: parsed.data.type,
        daily_rate: parsed.data.dailyRate,
        kwh_rate: kwhRate,
        status: 'AVAILABLE',
      });
    }
  });

  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/admin/garages');
  revalidatePath('/tenant/rent');

  const firstCode = nextCodes[0]!;
  const lastCode = nextCodes[nextCodes.length - 1]!;

  return {
    success: true,
    message: `Created ${nextCodes.length} bay(s): ${firstCode} to ${lastCode}.`,
    data: { createdCount: nextCodes.length, firstCode, lastCode },
  };
}

/**
 * Lists all garage bays for Admin inventory management.
 */
export async function listGarages(type?: GarageType): Promise<GarageItem[]> {
  await requireAdmin();
  await syncExpiredRentals();

  const rows = type
    ? await db.orm.public.Garage.where({ type })
        .orderBy((g) => g.garage_code.asc())
        .all()
    : await db.orm.public.Garage.orderBy((g) => g.garage_code.asc()).all();

  return rows.map((row) => ({
    garageCode: row.garage_code,
    type: row.type,
    dailyRate: row.daily_rate,
    kwhRate: row.kwh_rate,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

/**
 * Lists currently available garage bays for authenticated users during checkout.
 */
export async function listAvailableGaragesForToday(
  type?: GarageType,
): Promise<GarageItem[]> {
  await requireSessionUser();
  await syncExpiredRentals();

  const rows = type
    ? await db.orm.public.Garage.where({ type, status: 'AVAILABLE' })
        .orderBy((g) => g.garage_code.asc())
        .all()
    : await db.orm.public.Garage.where({ status: 'AVAILABLE' })
        .orderBy((g) => g.garage_code.asc())
        .all();

  return rows.map((row) => ({
    garageCode: row.garage_code,
    type: row.type,
    dailyRate: row.daily_rate,
    kwhRate: row.kwh_rate,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

/**
 * Returns highest existing numeric bay code sequence per garage category.
 */
export async function getMaxCodeSequenceByType(): Promise<Record<GarageType, number>> {
  await requireAdmin();

  const all = await db.orm.public.Garage.select('garage_code', 'type').all();
  const byType: Record<GarageType, string[]> = { BICYCLE: [], CAR: [], EV: [] };
  for (const row of all) {
    byType[row.type].push(row.garage_code);
  }

  return {
    BICYCLE: GarageCodeGenerator.getMaxSequenceNumber('BICYCLE', byType.BICYCLE),
    CAR: GarageCodeGenerator.getMaxSequenceNumber('CAR', byType.CAR),
    EV: GarageCodeGenerator.getMaxSequenceNumber('EV', byType.EV),
  };
}

/**
 * Public facility summary of bay availability and starting rates per category.
 */
export async function getPublicFacilitySummary(): Promise<GarageSummaryByType[]> {
  await syncExpiredRentals();
  const all = await db.orm.public.Garage.all();
  const types: GarageType[] = ['BICYCLE', 'CAR', 'EV'];

  return types.map((type) => {
    const matching = all.filter((g) => g.type === type);
    const available = matching.filter((g) => g.status === 'AVAILABLE');
    const dailyRates = matching.map((g) => g.daily_rate);
    const kwhRates = matching
      .map((g) => g.kwh_rate)
      .filter((rate): rate is number => rate !== null);

    const minDailyRate = dailyRates.length > 0 ? Math.min(...dailyRates) : null;
    return {
      type,
      totalCount: matching.length,
      availableCount: available.length,
      usedCount: matching.length - available.length,
      minDailyRate,
      minMonthlyRate:
        minDailyRate !== null ? minDailyRate * MONTHLY_RATE_MULTIPLIER : null,
      minKwhRate: kwhRates.length > 0 ? Math.min(...kwhRates) : null,
    };
  });
}
