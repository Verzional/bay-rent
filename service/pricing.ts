import type {
  ExtensionPricingBreakdown,
  GarageType,
  PricingBreakdown,
  RentalType,
  VehicleType,
} from '@/types';
import { DateCalculator } from '@/utils/date';

/**
 * Multiplier applied to `dailyRate` for one full calendar month of garage rent.
 */
export const MONTHLY_RATE_MULTIPLIER = 25;

/**
 * Abstract OOP strategy defining vehicle compatibility and pricing rules
 * for a specific garage bay category.
 */
export abstract class BasePricingStrategy {
  public abstract readonly garageType: GarageType;
  public abstract readonly allowedVehicleTypes: readonly VehicleType[];

  /**
   * Returns `true` if `vehicleType` can park in this garage category.
   */
  public supportsVehicle(vehicleType: VehicleType): boolean {
    return this.allowedVehicleTypes.includes(vehicleType);
  }

  /**
   * Throws an error when `vehicleType` is incompatible with this garage type.
   */
  public assertCompatible(vehicleType: VehicleType): void {
    if (!this.supportsVehicle(vehicleType)) {
      throw new Error(
        `Vehicle type ${vehicleType} cannot be parked in a ${this.garageType} garage.`,
      );
    }
  }

  /**
   * Computes base garage rent (`daysCount * dailyRate` for daily, `25 * dailyRate` for monthly).
   */
  public calculateBaseRent(
    dailyRate: number,
    rentalType: RentalType,
    daysCount?: number | null,
  ): number {
    if (dailyRate <= 0) {
      throw new Error('Garage daily rate must be greater than zero.');
    }

    if (rentalType === 'MONTHLY') {
      return dailyRate * MONTHLY_RATE_MULTIPLIER;
    }

    if (
      daysCount === undefined ||
      daysCount === null ||
      !Number.isInteger(daysCount) ||
      daysCount < 1 ||
      daysCount > 30
    ) {
      throw new Error('Daily rentals must specify 1 to 30 days.');
    }

    return dailyRate * daysCount;
  }

  /**
   * Computes one-time EV full-charging fee when applicable. Defaults to `0`.
   */
  public calculateChargingCost(
    _vehicleType: VehicleType,
    _batteryKwh: number | null,
    _kwhRate: number | null,
  ): number {
    void _vehicleType;
    void _batteryKwh;
    void _kwhRate;
    return 0;
  }

  /**
   * Computes complete pricing and end date for an initial garage rental.
   */
  public calculateInitialRentalCost(params: {
    startDate: Date;
    rentalType: RentalType;
    daysCount?: number | null;
    dailyRate: number;
    kwhRate: number | null;
    vehicleType: VehicleType;
    batteryKwh: number | null;
  }): PricingBreakdown {
    this.assertCompatible(params.vehicleType);

    const endDate = DateCalculator.calculateInitialEndDate(
      params.startDate,
      params.rentalType,
      params.daysCount,
    );
    const decomposed = DateCalculator.decomposePeriodToMonthsAndDays(
      params.startDate,
      endDate,
    );
    const baseCost = this.calculateBaseRent(
      params.dailyRate,
      params.rentalType,
      params.daysCount,
    );
    const chargingCost = this.calculateChargingCost(
      params.vehicleType,
      params.batteryKwh,
      params.kwhRate,
    );

    return {
      baseCost,
      chargingCost,
      totalCost: baseCost + chargingCost,
      fullMonths: decomposed.fullMonths,
      remainingDays: decomposed.remainingDays,
      totalDays: decomposed.totalDays,
      endDate,
    };
  }

  /**
   * Computes remaining cost for extending an active rental from `previousEndDate`
   * to `newEndDate` using identical calendar-month (25x) + daily (1x) + EV logic.
   */
  public calculateExtensionCost(params: {
    previousEndDate: Date;
    newEndDate: Date;
    dailyRate: number;
    kwhRate: number | null;
    vehicleType: VehicleType;
    batteryKwh: number | null;
  }): ExtensionPricingBreakdown {
    this.assertCompatible(params.vehicleType);

    if (params.dailyRate <= 0) {
      throw new Error('Garage daily rate must be greater than zero.');
    }

    const previousEndDate = DateCalculator.toUtcMidnight(params.previousEndDate);
    const newEndDate = DateCalculator.toUtcMidnight(params.newEndDate);
    const { fullMonths, remainingDays, totalDays } =
      DateCalculator.decomposePeriodToMonthsAndDays(previousEndDate, newEndDate);

    const baseCost =
      fullMonths * MONTHLY_RATE_MULTIPLIER * params.dailyRate +
      remainingDays * params.dailyRate;

    const chargingCost = this.calculateChargingCost(
      params.vehicleType,
      params.batteryKwh,
      params.kwhRate,
    );

    return {
      baseCost,
      chargingCost,
      remainingCost: baseCost + chargingCost,
      fullMonths,
      remainingDays,
      totalDays,
      previousEndDate,
      newEndDate,
    };
  }
}

/**
 * Pricing & compatibility strategy for Bicycle (`S###`) bays (bicycles & motorcycles).
 */
export class BicycleGaragePricing extends BasePricingStrategy {
  public readonly garageType: GarageType = 'BICYCLE';
  public readonly allowedVehicleTypes: readonly VehicleType[] = ['BICYCLE', 'MOTORCYCLE'];
}

/**
 * Pricing & compatibility strategy for Car (`C###`) bays (cars & EVs without charging).
 */
export class CarGaragePricing extends BasePricingStrategy {
  public readonly garageType: GarageType = 'CAR';
  public readonly allowedVehicleTypes: readonly VehicleType[] = ['CAR', 'EV'];
}

/**
 * Pricing & compatibility strategy for EV (`E###`) bays with mandatory one-time full charge.
 */
export class EvGaragePricing extends BasePricingStrategy {
  public readonly garageType: GarageType = 'EV';
  public readonly allowedVehicleTypes: readonly VehicleType[] = ['EV'];

  public override calculateChargingCost(
    vehicleType: VehicleType,
    batteryKwh: number | null,
    kwhRate: number | null,
  ): number {
    this.assertCompatible(vehicleType);

    if (batteryKwh === null || batteryKwh <= 0) {
      throw new Error('Battery capacity (kWh) must be greater than 0.');
    }

    if (kwhRate === null || kwhRate <= 0) {
      throw new Error('EV garage kWh rate must be greater than zero.');
    }

    return Math.round(batteryKwh * kwhRate * 100) / 100;
  }
}

/**
 * Factory resolving the concrete OOP pricing strategy per garage bay type.
 */
export class PricingStrategyFactory {
  private static readonly strategies: Record<GarageType, BasePricingStrategy> = {
    BICYCLE: new BicycleGaragePricing(),
    CAR: new CarGaragePricing(),
    EV: new EvGaragePricing(),
  };

  public static getStrategy(garageType: GarageType): BasePricingStrategy {
    return PricingStrategyFactory.strategies[garageType];
  }

  public static getCompatibleGarageTypes(vehicleType: VehicleType): GarageType[] {
    return (Object.values(PricingStrategyFactory.strategies) as BasePricingStrategy[])
      .filter((strategy) => strategy.supportsVehicle(vehicleType))
      .map((strategy) => strategy.garageType);
  }
}
