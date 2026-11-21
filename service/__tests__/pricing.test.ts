import { describe, expect, it } from 'vitest';
import { PricingStrategyFactory } from '@/service/pricing';
import { DateCalculator } from '@/utils/date';

describe('PricingStrategyFactory & OOP Pricing Strategies', () => {
  it('enforces the vehicle-to-garage compatibility matrix', () => {
    expect(PricingStrategyFactory.getCompatibleGarageTypes('BICYCLE')).toEqual(['BICYCLE']);
    expect(PricingStrategyFactory.getCompatibleGarageTypes('MOTORCYCLE')).toEqual(['BICYCLE']);
    expect(PricingStrategyFactory.getCompatibleGarageTypes('CAR')).toEqual(['CAR']);
    expect(PricingStrategyFactory.getCompatibleGarageTypes('EV')).toEqual(['CAR', 'EV']);

    expect(() =>
      PricingStrategyFactory.getStrategy('BICYCLE').assertCompatible('CAR'),
    ).toThrow();
    expect(() =>
      PricingStrategyFactory.getStrategy('EV').assertCompatible('CAR'),
    ).toThrow();
  });

  it('computes daily and monthly (25x daily) costs without EV charging for non-EV bays', () => {
    const start = DateCalculator.parseIsoDate('2026-05-01');
    const carBay = PricingStrategyFactory.getStrategy('CAR');

    const dailyResult = carBay.calculateInitialRentalCost({
      startDate: start,
      rentalType: 'DAILY',
      daysCount: 10,
      dailyRate: 50_000,
      kwhRate: null,
      vehicleType: 'CAR',
      batteryKwh: null,
    });
    expect(dailyResult.baseCost).toBe(500_000);
    expect(dailyResult.chargingCost).toBe(0);
    expect(dailyResult.totalCost).toBe(500_000);

    const evInCarMonthly = carBay.calculateInitialRentalCost({
      startDate: start,
      rentalType: 'MONTHLY',
      dailyRate: 50_000,
      kwhRate: null,
      vehicleType: 'EV',
      batteryKwh: 60,
    });
    expect(evInCarMonthly.baseCost).toBe(1_250_000);
    expect(evInCarMonthly.chargingCost).toBe(0);
    expect(evInCarMonthly.totalCost).toBe(1_250_000);
  });

  it('adds one-time full EV battery charge when an EV parks in an EV bay', () => {
    const start = DateCalculator.parseIsoDate('2026-03-01');
    const evBay = PricingStrategyFactory.getStrategy('EV');

    const result = evBay.calculateInitialRentalCost({
      startDate: start,
      rentalType: 'MONTHLY',
      dailyRate: 80_000,
      kwhRate: 2_500,
      vehicleType: 'EV',
      batteryKwh: 60,
    });

    expect(result.baseCost).toBe(2_000_000);
    expect(result.chargingCost).toBe(150_000);
    expect(result.totalCost).toBe(2_150_000);
    expect(DateCalculator.formatIsoDate(result.endDate)).toBe('2026-04-01');
  });

  it('calculates extension costs using identical calendar-month (25x) + daily (1x) + EV logic', () => {
    const evBay = PricingStrategyFactory.getStrategy('EV');
    const prevEnd = DateCalculator.parseIsoDate('2026-03-01');

    const thirtyDaysInMarch = evBay.calculateExtensionCost({
      previousEndDate: prevEnd,
      newEndDate: DateCalculator.parseIsoDate('2026-03-31'),
      dailyRate: 80_000,
      kwhRate: 2_500,
      vehicleType: 'EV',
      batteryKwh: 60,
    });
    expect(thirtyDaysInMarch.fullMonths).toBe(0);
    expect(thirtyDaysInMarch.remainingDays).toBe(30);
    expect(thirtyDaysInMarch.remainingCost).toBe(2_550_000);

    const oneMonthTwoDays = evBay.calculateExtensionCost({
      previousEndDate: prevEnd,
      newEndDate: DateCalculator.parseIsoDate('2026-04-03'),
      dailyRate: 80_000,
      kwhRate: 2_500,
      vehicleType: 'EV',
      batteryKwh: 60,
    });
    expect(oneMonthTwoDays.fullMonths).toBe(1);
    expect(oneMonthTwoDays.remainingDays).toBe(2);
    expect(oneMonthTwoDays.remainingCost).toBe(2_310_000);
  });
});
