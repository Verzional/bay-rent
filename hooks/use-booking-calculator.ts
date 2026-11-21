'use client';

import { useMemo } from 'react';
import { PricingStrategyFactory } from '@/service/pricing';
import type { BookingCalculatorInput, BookingCalculatorResult } from '@/types';
import { DateCalculator } from '@/utils/date';

/**
 * Computes real-time vehicle-to-garage compatibility, auto end date, and
 * itemized Rupiah rental cost breakdown using the domain pricing strategies.
 */
export function useBookingCalculator(
  input: BookingCalculatorInput,
): BookingCalculatorResult {
  return useMemo(() => {
    const effectiveVehicleType =
      input.vehicleMode === 'existing'
        ? input.existingVehicleType
        : input.newVehicleType;

    const effectiveBatteryKwh =
      effectiveVehicleType === 'EV'
        ? input.vehicleMode === 'existing'
          ? input.existingVehicleBatteryKwh
          : input.newVehicleBatteryKwh.trim() === ''
            ? null
            : Number(input.newVehicleBatteryKwh)
        : null;

    const compatibleGarageTypes = effectiveVehicleType
      ? PricingStrategyFactory.getCompatibleGarageTypes(effectiveVehicleType)
      : [];

    if (!effectiveVehicleType || input.selectedGarageDailyRate === null) {
      return {
        compatibleGarageTypes,
        effectiveVehicleType,
        effectiveBatteryKwh,
        endDateIso: null,
        baseCost: 0,
        chargingCost: 0,
        totalCost: 0,
        errorMessage: null,
      };
    }

    try {
      const startDate = DateCalculator.today();
      const strategy = PricingStrategyFactory.getStrategy(input.selectedGarageType);
      const breakdown = strategy.calculateInitialRentalCost({
        startDate,
        rentalType: input.rentalType,
        daysCount: input.rentalType === 'DAILY' ? input.daysCount : null,
        dailyRate: input.selectedGarageDailyRate,
        kwhRate: input.selectedGarageKwhRate,
        vehicleType: effectiveVehicleType,
        batteryKwh: Number.isFinite(effectiveBatteryKwh) ? effectiveBatteryKwh : null,
      });

      return {
        compatibleGarageTypes,
        effectiveVehicleType,
        effectiveBatteryKwh,
        endDateIso: DateCalculator.formatIsoDate(breakdown.endDate),
        baseCost: breakdown.baseCost,
        chargingCost: breakdown.chargingCost,
        totalCost: breakdown.totalCost,
        errorMessage: null,
      };
    } catch (error) {
      return {
        compatibleGarageTypes,
        effectiveVehicleType,
        effectiveBatteryKwh,
        endDateIso: null,
        baseCost: 0,
        chargingCost: 0,
        totalCost: 0,
        errorMessage:
          error instanceof Error ? error.message : 'Unable to calculate cost.',
      };
    }
  }, [input]);
}
