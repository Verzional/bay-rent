import type {
  AdminOverview,
  DailyReportRow,
  GarageItem,
  GarageType,
  GarageTypeReportRow,
  MonthlyReportRow,
  RentalDetail,
  TenantReportRow,
} from '@/types';
import { DateCalculator } from '@/utils/date';

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

/**
 * Aggregates monthly rental & extension revenue across all 12 months of `year`.
 */
export function aggregateMonthlyReport(
  rentals: RentalDetail[],
  year: number,
): MonthlyReportRow[] {
  const rows: MonthlyReportRow[] = MONTH_NAMES.map((label, idx) => ({
    month: idx + 1,
    monthLabel: label,
    rentalCount: 0,
    extensionCount: 0,
    initialRevenue: 0,
    extensionRevenue: 0,
    totalRevenue: 0,
  }));

  for (const rental of rentals) {
    if (rental.startDate.getUTCFullYear() === year) {
      const bucket = rows[rental.startDate.getUTCMonth()]!;
      bucket.rentalCount += 1;
      bucket.initialRevenue += rental.totalCost;
      bucket.totalRevenue += rental.totalCost;
    }

    for (const ext of rental.extensions) {
      if (ext.createdAt.getUTCFullYear() === year) {
        const bucket = rows[ext.createdAt.getUTCMonth()]!;
        bucket.extensionCount += 1;
        bucket.extensionRevenue += ext.remainingCost;
        bucket.totalRevenue += ext.remainingCost;
      }
    }
  }

  return rows;
}

/**
 * Aggregates daily rental & extension revenue for each day in a given `year` and `month` (`1-12`).
 */
export function aggregateDailyReport(
  rentals: RentalDetail[],
  year: number,
  month: number,
): DailyReportRow[] {
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const rows: DailyReportRow[] = Array.from({ length: daysInMonth }, (_, idx) => {
    const day = idx + 1;
    return {
      day,
      dateLabel: `${String(day).padStart(2, '0')} ${MONTH_NAMES[month - 1]}`,
      rentalCount: 0,
      extensionCount: 0,
      initialRevenue: 0,
      extensionRevenue: 0,
      totalRevenue: 0,
    };
  });

  for (const rental of rentals) {
    if (
      rental.startDate.getUTCFullYear() === year &&
      rental.startDate.getUTCMonth() === month - 1
    ) {
      const bucket = rows[rental.startDate.getUTCDate() - 1];
      if (bucket) {
        bucket.rentalCount += 1;
        bucket.initialRevenue += rental.totalCost;
        bucket.totalRevenue += rental.totalCost;
      }
    }

    for (const ext of rental.extensions) {
      if (
        ext.createdAt.getUTCFullYear() === year &&
        ext.createdAt.getUTCMonth() === month - 1
      ) {
        const bucket = rows[ext.createdAt.getUTCDate() - 1];
        if (bucket) {
          bucket.extensionCount += 1;
          bucket.extensionRevenue += ext.remainingCost;
          bucket.totalRevenue += ext.remainingCost;
        }
      }
    }
  }

  return rows;
}

/**
 * Aggregates rental volume and revenue grouped by garage bay category (`BICYCLE`, `CAR`, `EV`).
 */
export function aggregateByGarageType(rentals: RentalDetail[]): GarageTypeReportRow[] {
  const map = new Map<GarageType, GarageTypeReportRow>([
    [
      'BICYCLE',
      {
        garageType: 'BICYCLE',
        totalRentals: 0,
        activeRentals: 0,
        completedRentals: 0,
        extensionCount: 0,
        totalRevenue: 0,
      },
    ],
    [
      'CAR',
      {
        garageType: 'CAR',
        totalRentals: 0,
        activeRentals: 0,
        completedRentals: 0,
        extensionCount: 0,
        totalRevenue: 0,
      },
    ],
    [
      'EV',
      {
        garageType: 'EV',
        totalRentals: 0,
        activeRentals: 0,
        completedRentals: 0,
        extensionCount: 0,
        totalRevenue: 0,
      },
    ],
  ]);

  for (const rental of rentals) {
    const row = map.get(rental.garageType)!;
    row.totalRentals += 1;
    if (rental.status === 'ACTIVE') {
      row.activeRentals += 1;
    } else {
      row.completedRentals += 1;
    }
    row.extensionCount += rental.extensions.length;
    row.totalRevenue += rental.grandTotalCost;
  }

  return Array.from(map.values());
}

/**
 * Aggregates rental counts and total spend per tenant, ordered highest spend first.
 */
export function aggregateByTenant(rentals: RentalDetail[]): TenantReportRow[] {
  const map = new Map<number, TenantReportRow>();

  for (const rental of rentals) {
    let row = map.get(rental.tenantId);
    if (!row) {
      row = {
        tenantId: rental.tenantId,
        nationalId: rental.tenantNationalId,
        fullName: rental.tenantName,
        email: rental.tenantEmail,
        phoneNumber: rental.tenantPhone,
        totalRentals: 0,
        activeRentals: 0,
        extensionCount: 0,
        totalSpend: 0,
      };
      map.set(rental.tenantId, row);
    }

    row.totalRentals += 1;
    if (rental.status === 'ACTIVE') {
      row.activeRentals += 1;
    }
    row.extensionCount += rental.extensions.length;
    row.totalSpend += rental.grandTotalCost;
  }

  return Array.from(map.values()).sort((a, b) => b.totalSpend - a.totalSpend);
}

/**
 * Computes top-level Admin operational KPIs from bays, rentals, and pending count.
 */
export function computeAdminOverview(params: {
  garages: Pick<GarageItem, 'status'>[];
  activeRentalsCount: number;
  allRentals: RentalDetail[];
  pendingVerifications: number;
  now?: Date;
}): AdminOverview {
  const totalGarages = params.garages.length;
  const availableGarages = params.garages.filter((g) => g.status === 'AVAILABLE').length;
  const usedGarages = totalGarages - availableGarages;
  const occupancyRate =
    totalGarages > 0 ? Math.round((usedGarages / totalGarages) * 100) : 0;

  const today = DateCalculator.today(params.now);
  const currentYear = today.getUTCFullYear();
  const currentMonth = today.getUTCMonth();

  let currentMonthRevenue = 0;
  for (const rental of params.allRentals) {
    if (
      rental.startDate.getUTCFullYear() === currentYear &&
      rental.startDate.getUTCMonth() === currentMonth
    ) {
      currentMonthRevenue += rental.totalCost;
    }
    for (const ext of rental.extensions) {
      if (
        ext.createdAt.getUTCFullYear() === currentYear &&
        ext.createdAt.getUTCMonth() === currentMonth
      ) {
        currentMonthRevenue += ext.remainingCost;
      }
    }
  }

  return {
    totalGarages,
    availableGarages,
    usedGarages,
    occupancyRate,
    pendingVerifications: params.pendingVerifications,
    activeRentalsToday: params.activeRentalsCount,
    currentMonthRevenue,
  };
}
