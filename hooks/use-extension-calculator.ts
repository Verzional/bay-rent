'use client';

import { useMemo } from 'react';
import { PricingStrategyFactory } from '@/service/pricing';
import type { GarageType, VehicleType } from '@/types';
import { DateCalculator } from '@/utils/date';

export interface ExtensionCalculatorResult {
  fullMonths: number;
  remainingDays: number;
  totalDays: number;
  baseCost: number;
  chargingCost: number;
  remainingCost: number;
  errorMessage: string | null;
}

/**
 * Computes live remaining rental extension cost (`fullMonths`, `remainingDays`,
 * and EV charging fee) using the domain extension pricing rules.
 */
export function useExtensionCalculator(params: {
  previousEndDate: Date | string;
  newEndDateIso: string;
  garageType: GarageType;
  dailyRate: number;
  kwhRate: number | null;
  vehicleType: VehicleType;
  batteryKwh: number | null;
}): ExtensionCalculatorResult {
  return useMemo(() => {
    if (!params.newEndDateIso) {
      return {
        fullMonths: 0,
        remainingDays: 0,
        totalDays: 0,
        baseCost: 0,
        chargingCost: 0,
        remainingCost: 0,
        errorMessage: null,
      };
    }

    try {
      const prevDate =
        typeof params.previousEndDate === 'string'
          ? new Date(params.previousEndDate)
          : params.previousEndDate;
      const nextDate = DateCalculator.parseIsoDate(params.newEndDateIso);
      const strategy = PricingStrategyFactory.getStrategy(params.garageType);
      const result = strategy.calculateExtensionCost({
        previousEndDate: prevDate,
        newEndDate: nextDate,
        dailyRate: params.dailyRate,
        kwhRate: params.kwhRate,
        vehicleType: params.vehicleType,
        batteryKwh: params.batteryKwh,
      });

      return {
        fullMonths: result.fullMonths,
        remainingDays: result.remainingDays,
        totalDays: result.totalDays,
        baseCost: result.baseCost,
        chargingCost: result.chargingCost,
        remainingCost: result.remainingCost,
        errorMessage: null,
      };
    } catch (error) {
      return {
        fullMonths: 0,
        remainingDays: 0,
        totalDays: 0,
        baseCost: 0,
        chargingCost: 0,
        remainingCost: 0,
        errorMessage:
          error instanceof Error ? error.message : 'Invalid extension end date.',
      };
    }
  }, [
    params.batteryKwh,
    params.dailyRate,
    params.garageType,
    params.kwhRate,
    params.newEndDateIso,
    params.previousEndDate,
    params.vehicleType,
  ]);
}
