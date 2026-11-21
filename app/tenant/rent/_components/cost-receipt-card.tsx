'use client';

import { Zap } from 'lucide-react';
import { BayPlaque } from '@/app/_components/common/bay-plaque';
import { CurrencyText } from '@/app/_components/common/currency-text';
import { SubmitButton } from '@/app/_components/common/submit-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { Separator } from '@/app/_components/ui/separator';
import { formatDate, RENTAL_TYPE_LABELS, VEHICLE_TYPE_LABELS } from '@/utils/format';
import type { BookingCalculatorResult } from '@/types';
import type { GarageItem, RentalType } from '@/types';

interface CostReceiptCardProps {
  selectedGarage: GarageItem | null;
  rentalType: RentalType;
  daysCount: number;
  startDateIso: string;
  calculator: BookingCalculatorResult;
  hasPaymentProof: boolean;
  isSubmitting: boolean;
}

/**
 * Sticky live digital receipt card showing auto-calculated end date and Rupiah breakdown.
 */
export function CostReceiptCard({
  selectedGarage,
  rentalType,
  daysCount,
  startDateIso,
  calculator,
  hasPaymentProof,
  isSubmitting,
}: CostReceiptCardProps) {
  const canSubmit =
    Boolean(selectedGarage) &&
    Boolean(calculator.endDateIso) &&
    !calculator.errorMessage &&
    hasPaymentProof;

  return (
    <Card className="sticky top-24 border-stone-300 shadow-sm">
      <CardHeader className="border-b border-stone-100 bg-stone-50/70 p-5 pb-4 sm:p-6 sm:pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm uppercase tracking-wider text-stone-700">
            Booking Cost Receipt
          </CardTitle>
          {selectedGarage ? (
            <BayPlaque code={selectedGarage.garageCode} type={selectedGarage.type} size="sm" />
          ) : (
            <span className="font-mono text-xs text-stone-400">NO BAY</span>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-5 pt-5 sm:p-6 sm:pt-5">
        <div className="space-y-2.5 text-sm">
          <div className="flex justify-between">
            <span className="text-stone-500">Vehicle Class</span>
            <span className="font-medium text-stone-900">
              {calculator.effectiveVehicleType
                ? VEHICLE_TYPE_LABELS[calculator.effectiveVehicleType]
                : '—'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Plan</span>
            <span className="font-medium text-stone-900">
              {RENTAL_TYPE_LABELS[rentalType]}
              {rentalType === 'DAILY' ? ` (${daysCount} days)` : ' (1 calendar month)'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Start Date</span>
            <span className="font-mono text-xs font-semibold text-stone-900">
              {formatDate(startDateIso)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Auto End Date</span>
            <span className="font-mono text-xs font-semibold text-amber-700">
              {calculator.endDateIso ? formatDate(calculator.endDateIso) : '—'}
            </span>
          </div>
        </div>

        <Separator />

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-stone-500">
              {rentalType === 'MONTHLY'
                ? 'Base Rent (25× daily rate)'
                : `Base Rent (${daysCount} × daily rate)`}
            </span>
            <CurrencyText
              amount={calculator.baseCost}
              className="font-medium text-stone-900"
            />
          </div>

          {selectedGarage?.type === 'EV' ? (
            <div className="flex justify-between text-cyan-800">
              <span className="inline-flex items-center gap-1">
                <Zap className="h-3.5 w-3.5" />
                EV Full Charge ({calculator.effectiveBatteryKwh ?? 0} kWh)
              </span>
              <CurrencyText amount={calculator.chargingCost} className="font-medium" />
            </div>
          ) : null}
        </div>

        <Separator />

        <div className="flex items-baseline justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Total Payable
          </span>
          <CurrencyText
            amount={calculator.totalCost}
            className="text-2xl font-bold text-stone-900"
          />
        </div>

        {calculator.errorMessage ? (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {calculator.errorMessage}
          </p>
        ) : null}

        <SubmitButton
          pending={isSubmitting}
          pendingLabel="Confirming Rental..."
          disabled={!canSubmit}
          className="w-full"
          size="lg"
        >
          Confirm &amp; Rent Bay
        </SubmitButton>
        {!hasPaymentProof ? (
          <p className="text-center text-xs text-stone-500">
            Upload your payment proof image to enable confirmation.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
