import { Calendar, Zap } from 'lucide-react';
import { BayPlaque } from '@/app/_components/common/bay-plaque';
import { CurrencyText } from '@/app/_components/common/currency-text';
import { PaymentProofDialog } from '@/app/_components/common/payment-proof-dialog';
import { StatusBadge } from '@/app/_components/common/status-badge';
import { Card, CardContent, CardHeader } from '@/app/_components/ui/card';
import {
  formatDate,
  RENTAL_TYPE_LABELS,
  VEHICLE_TYPE_LABELS,
} from '@/utils/format';
import type { RentalDetail } from '@/types';

/**
 * Digital architectural Bay Pass card representing one active tenant bay rental.
 */
export function BayPassCard({ rental }: { rental: RentalDetail }) {
  return (
    <Card className="overflow-hidden border-l-4 border-l-amber-600">
      <CardHeader className="flex flex-row items-start justify-between gap-3 p-5 pb-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <BayPlaque code={rental.garageCode} type={rental.garageType} size="sm" />
            <StatusBadge status={rental.status} />
          </div>
          <p className="text-sm font-semibold text-stone-900">{rental.brandModel}</p>
          <p className="text-xs text-stone-500">
            {VEHICLE_TYPE_LABELS[rental.vehicleType]}
            {rental.licensePlate ? (
              <span className="ml-2 rounded bg-stone-100 px-1.5 py-0.5 font-mono text-stone-800">
                {rental.licensePlate}
              </span>
            ) : null}
          </p>
        </div>

        <div className="text-right">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
            {RENTAL_TYPE_LABELS[rental.rentalType]}
            {rental.daysCount ? ` (${rental.daysCount}d)` : ''}
          </p>
          <CurrencyText
            amount={rental.grandTotalCost}
            className="text-base font-bold text-stone-900"
          />
        </div>
      </CardHeader>

      <CardContent className="border-t border-stone-100 p-5 pt-4 sm:p-5 sm:pt-4">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-600">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-stone-400" />
                {formatDate(rental.startDate)} →{' '}
                <strong className="text-stone-900">{formatDate(rental.endDate)}</strong>
              </span>

              {rental.garageType === 'EV' && rental.batteryKwh ? (
                <span className="inline-flex items-center gap-1 font-mono text-cyan-800">
                  <Zap className="h-3.5 w-3.5" />
                  {rental.batteryKwh} kWh Full Charge Included
                </span>
              ) : null}
            </div>

            <p className="text-xs text-stone-500">
              {rental.extensions.length > 0
                ? `${rental.extensions.length} extension(s) applied`
                : 'Initial booking active'}
            </p>
          </div>

          <PaymentProofDialog
            proofUrl={rental.extensions[0]?.paymentProofUrl ?? rental.paymentProofUrl}
            title={`Payment Proof — Bay ${rental.garageCode}`}
          />
        </div>
      </CardContent>
    </Card>
  );
}
