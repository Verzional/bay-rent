import type { RentalType } from '@/types';

const MS_PER_DAY = 86_400_000;

/**
 * Pure calendar-date arithmetic helper supporting daily (1-30 day) and
 * exact calendar-month rental intervals.
 */
export class DateCalculator {
  /**
   * Returns the normalized UTC midnight date (`00:00:00.000Z`) for today in `now`'s local calendar.
   */
  public static today(now: Date = new Date()): Date {
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  }

  /**
   * Normalizes an existing Date instance to UTC midnight of its UTC calendar date.
   */
  public static toUtcMidnight(date: Date): Date {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  }

  /**
   * Parses a `YYYY-MM-DD` date string into a normalized UTC midnight Date.
   */
  public static parseIsoDate(isoDate: string): Date {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim());
    if (!match) {
      throw new Error('Invalid date format. Expected YYYY-MM-DD.');
    }
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const parsed = new Date(Date.UTC(year, month - 1, day));

    if (
      parsed.getUTCFullYear() !== year ||
      parsed.getUTCMonth() !== month - 1 ||
      parsed.getUTCDate() !== day
    ) {
      throw new Error('Invalid calendar date.');
    }

    return parsed;
  }

  /**
   * Formats a Date as `YYYY-MM-DD` using its UTC calendar fields.
   */
  public static formatIsoDate(date: Date): string {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /**
   * Adds `days` calendar days to a normalized UTC midnight Date.
   */
  public static addDays(date: Date, days: number): Date {
    const base = DateCalculator.toUtcMidnight(date);
    return new Date(base.getTime() + days * MS_PER_DAY);
  }

  /**
   * Adds `months` exact calendar months to `date`, clamping to month end when needed.
   */
  public static addCalendarMonths(date: Date, months: number): Date {
    const base = DateCalculator.toUtcMidnight(date);
    const startYear = base.getUTCFullYear();
    const startMonth = base.getUTCMonth();
    const startDay = base.getUTCDate();

    const targetMonthIndex = startMonth + months;
    const targetYear = startYear + Math.floor(targetMonthIndex / 12);
    const normalizedMonth = ((targetMonthIndex % 12) + 12) % 12;

    const lastDayOfTargetMonth = new Date(
      Date.UTC(targetYear, normalizedMonth + 1, 0),
    ).getUTCDate();
    const clampedDay = Math.min(startDay, lastDayOfTargetMonth);

    return new Date(Date.UTC(targetYear, normalizedMonth, clampedDay));
  }

  /**
   * Computes exact whole day difference `(toDate - fromDate)` in days.
   */
  public static diffDays(fromDate: Date, toDate: Date): number {
    const from = DateCalculator.toUtcMidnight(fromDate);
    const to = DateCalculator.toUtcMidnight(toDate);
    return Math.round((to.getTime() - from.getTime()) / MS_PER_DAY);
  }

  /**
   * Computes the initial rental end date based on `rentalType` and `daysCount`.
   */
  public static calculateInitialEndDate(
    startDate: Date,
    rentalType: RentalType,
    daysCount?: number | null,
  ): Date {
    const normalizedStart = DateCalculator.toUtcMidnight(startDate);

    if (rentalType === 'MONTHLY') {
      return DateCalculator.addCalendarMonths(normalizedStart, 1);
    }

    if (
      daysCount === undefined ||
      daysCount === null ||
      !Number.isInteger(daysCount) ||
      daysCount < 1 ||
      daysCount > 30
    ) {
      throw new Error('Daily rentals must be between 1 and 30 days.');
    }

    return DateCalculator.addDays(normalizedStart, daysCount);
  }

  /**
   * Decomposes `(fromDate, toDate]` into exact full calendar months plus leftover days.
   */
  public static decomposePeriodToMonthsAndDays(
    fromDate: Date,
    toDate: Date,
  ): { fullMonths: number; remainingDays: number; totalDays: number } {
    const start = DateCalculator.toUtcMidnight(fromDate);
    const end = DateCalculator.toUtcMidnight(toDate);

    if (end.getTime() <= start.getTime()) {
      throw new Error('New end date must be after the previous end date.');
    }

    let fullMonths = 0;
    while (true) {
      const nextMonthBoundary = DateCalculator.addCalendarMonths(start, fullMonths + 1);
      if (nextMonthBoundary.getTime() <= end.getTime()) {
        fullMonths += 1;
      } else {
        break;
      }
    }

    const monthAnchor =
      fullMonths > 0 ? DateCalculator.addCalendarMonths(start, fullMonths) : start;
    const remainingDays = DateCalculator.diffDays(monthAnchor, end);
    const totalDays = DateCalculator.diffDays(start, end);

    return {
      fullMonths,
      remainingDays,
      totalDays,
    };
  }

  /**
   * Returns `true` when `endDate` is strictly before `today`.
   */
  public static isExpired(endDate: Date, today: Date = DateCalculator.today()): boolean {
    const normalizedEnd = DateCalculator.toUtcMidnight(endDate);
    const normalizedToday = DateCalculator.toUtcMidnight(today);
    return normalizedEnd.getTime() < normalizedToday.getTime();
  }
}
