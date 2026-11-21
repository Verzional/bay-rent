import { describe, expect, it } from 'vitest';
import { DateCalculator } from '@/utils/date';

describe('DateCalculator', () => {
  it('computes daily end date for 1 to 30 days', () => {
    const start = DateCalculator.parseIsoDate('2026-03-01');
    expect(
      DateCalculator.formatIsoDate(DateCalculator.calculateInitialEndDate(start, 'DAILY', 1)),
    ).toBe('2026-03-02');
    expect(
      DateCalculator.formatIsoDate(DateCalculator.calculateInitialEndDate(start, 'DAILY', 30)),
    ).toBe('2026-03-31');
  });

  it('caps daily durations to (daysInMonth - 1): 29 in Nov, 27 in non-leap Feb, 28 in leap Feb, 30 in Mar', () => {
    const mar = DateCalculator.parseIsoDate('2026-03-01');
    const nov = DateCalculator.parseIsoDate('2026-11-21');
    const febNonLeap = DateCalculator.parseIsoDate('2026-02-01');
    const febLeap = DateCalculator.parseIsoDate('2024-02-01');

    expect(DateCalculator.getMaxDailyDays(mar)).toBe(30);
    expect(DateCalculator.getMaxDailyDays(nov)).toBe(29);
    expect(DateCalculator.getMaxDailyDays(febNonLeap)).toBe(27);
    expect(DateCalculator.getMaxDailyDays(febLeap)).toBe(28);

    expect(() => DateCalculator.calculateInitialEndDate(mar, 'DAILY', 0)).toThrow();
    expect(() => DateCalculator.calculateInitialEndDate(mar, 'DAILY', 31)).toThrow();
    expect(() => DateCalculator.calculateInitialEndDate(nov, 'DAILY', 30)).toThrow();
    expect(() => DateCalculator.calculateInitialEndDate(febNonLeap, 'DAILY', 28)).toThrow();
    expect(() => DateCalculator.calculateInitialEndDate(mar, 'DAILY', null)).toThrow();
  });

  it('calculates exact calendar month for MONTHLY rentals across 31-day and Feb months', () => {
    const marchStart = DateCalculator.parseIsoDate('2026-03-01');
    expect(
      DateCalculator.formatIsoDate(
        DateCalculator.calculateInitialEndDate(marchStart, 'MONTHLY'),
      ),
    ).toBe('2026-04-01');

    const jan31NonLeap = DateCalculator.parseIsoDate('2026-01-31');
    expect(
      DateCalculator.formatIsoDate(
        DateCalculator.calculateInitialEndDate(jan31NonLeap, 'MONTHLY'),
      ),
    ).toBe('2026-02-28');

    const jan31Leap = DateCalculator.parseIsoDate('2024-01-31');
    expect(
      DateCalculator.formatIsoDate(
        DateCalculator.calculateInitialEndDate(jan31Leap, 'MONTHLY'),
      ),
    ).toBe('2024-02-29');
  });

  it('decomposes March 30 days as 0 months + 30 days and 31 days as 1 month + 0 days', () => {
    const start = DateCalculator.parseIsoDate('2026-03-01');
    const thirtyDays = DateCalculator.parseIsoDate('2026-03-31');
    const fullMarch = DateCalculator.parseIsoDate('2026-04-01');

    expect(DateCalculator.decomposePeriodToMonthsAndDays(start, thirtyDays)).toEqual({
      fullMonths: 0,
      remainingDays: 30,
      totalDays: 30,
    });

    expect(DateCalculator.decomposePeriodToMonthsAndDays(start, fullMarch)).toEqual({
      fullMonths: 1,
      remainingDays: 0,
      totalDays: 31,
    });
  });

  it('decomposes multi-month + leftover day extensions from original anchor day', () => {
    const start = DateCalculator.parseIsoDate('2026-01-31');
    const end = DateCalculator.parseIsoDate('2026-04-05');

    expect(DateCalculator.decomposePeriodToMonthsAndDays(start, end)).toEqual({
      fullMonths: 2,
      remainingDays: 5,
      totalDays: 64,
    });
  });

  it('detects expired dates strictly before today', () => {
    const today = DateCalculator.parseIsoDate('2026-11-21');
    expect(DateCalculator.isExpired(DateCalculator.parseIsoDate('2026-11-20'), today)).toBe(true);
    expect(DateCalculator.isExpired(DateCalculator.parseIsoDate('2026-11-21'), today)).toBe(false);
    expect(DateCalculator.isExpired(DateCalculator.parseIsoDate('2026-11-22'), today)).toBe(false);
  });
});
