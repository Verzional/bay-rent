'use server';

import { requireAdmin } from '@/lib/session';
import { db } from '@/prisma/db';
import {
  type AdminOverview,
  type DailyReportRow,
  type GarageTypeReportRow,
  type MonthlyReportRow,
  parseSchema,
  reportYearMonthSchema,
  type TenantReportRow,
} from '@/types';
import { countPendingVerifications } from './auth';
import { fetchRentalDetails, syncExpiredRentals } from './rental';
import {
  aggregateByGarageType,
  aggregateByTenant,
  aggregateDailyReport,
  aggregateMonthlyReport,
  computeAdminOverview,
} from './report-aggregator';

/**
 * Returns top-level operational KPIs for the Admin dashboard.
 */
export async function getAdminDashboardOverview(): Promise<AdminOverview> {
  await requireAdmin();
  await syncExpiredRentals();

  const [garages, allRentals, pendingVerifications] = await Promise.all([
    db.orm.public.Garage.select('status').all(),
    fetchRentalDetails(),
    countPendingVerifications(),
  ]);

  const activeRentalsCount = allRentals.filter((r) => r.status === 'ACTIVE').length;

  return computeAdminOverview({
    garages,
    activeRentalsCount,
    allRentals,
    pendingVerifications,
  });
}

/**
 * Report 1: Monthly rental and extension breakdown across a given `year`.
 */
export async function getMonthlyReport(year: number): Promise<MonthlyReportRow[]> {
  await requireAdmin();
  const parsed = parseSchema(reportYearMonthSchema, { year });
  if (!parsed.ok) {
    throw new Error(parsed.message);
  }

  await syncExpiredRentals();
  const rentals = await fetchRentalDetails();
  return aggregateMonthlyReport(rentals, parsed.data.year);
}

/**
 * Report 2: Daily rental and extension breakdown across a given `year` and `month` (`1-12`).
 */
export async function getDailyReport(
  year: number,
  month: number,
): Promise<DailyReportRow[]> {
  await requireAdmin();
  const parsed = parseSchema(reportYearMonthSchema, { year, month });
  if (!parsed.ok) {
    throw new Error(parsed.message);
  }

  await syncExpiredRentals();
  const rentals = await fetchRentalDetails();
  return aggregateDailyReport(rentals, parsed.data.year, parsed.data.month ?? 1);
}

/**
 * Report 3: Aggregated rental counts and revenue grouped by garage bay category.
 */
export async function getByGarageTypeReport(): Promise<GarageTypeReportRow[]> {
  await requireAdmin();
  await syncExpiredRentals();
  const rentals = await fetchRentalDetails();
  return aggregateByGarageType(rentals);
}

/**
 * Report 4: Aggregated rental counts and cumulative spend grouped per tenant.
 */
export async function getByTenantReport(): Promise<TenantReportRow[]> {
  await requireAdmin();
  await syncExpiredRentals();
  const rentals = await fetchRentalDetails();
  return aggregateByTenant(rentals);
}
