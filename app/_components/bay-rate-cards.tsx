import { Bike, CarFront, Zap } from 'lucide-react';
import { BayPlaque } from '@/app/_components/common/bay-plaque';
import { CurrencyText } from '@/app/_components/common/currency-text';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { GARAGE_TYPE_LABELS } from '@/utils/format';
import type { GarageSummaryByType, GarageType } from '@/types';

const SAMPLE_PLAQUE: Record<GarageType, string> = {
  BICYCLE: 'S###',
  CAR: 'C###',
  EV: 'E###',
};

const TYPE_COMPATIBILITY: Record<GarageType, string> = {
  BICYCLE: 'Supports Bicycles & Motorcycles',
  CAR: 'Supports Cars & EVs (parking only)',
  EV: 'EVs only · Includes full battery charge',
};

const TYPE_ICON: Record<GarageType, typeof Bike> = {
  BICYCLE: Bike,
  CAR: CarFront,
  EV: Zap,
};

/**
 * Displays live available bay counts and starting daily/monthly/kWh rates per garage type.
 */
export function BayRateCards({ summaries }: { summaries: GarageSummaryByType[] }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
            Live Facility Capacity
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-stone-900">
            Available Garage Bays Today
          </h2>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {summaries.map((item) => {
          const Icon = TYPE_ICON[item.type];
          return (
            <Card key={item.type} className="flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <BayPlaque code={SAMPLE_PLAQUE[item.type]} type={item.type} />
                  <div className="rounded-lg border border-stone-200 bg-stone-50 p-2 text-stone-700">
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <CardTitle className="mt-3 text-lg">
                  {GARAGE_TYPE_LABELS[item.type]}
                </CardTitle>
                <p className="text-xs text-stone-500">{TYPE_COMPATIBILITY[item.type]}</p>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-baseline justify-between rounded-lg border border-stone-200 bg-stone-50 px-4 py-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                    Available Today
                  </span>
                  <div className="font-mono text-lg font-bold text-stone-900 tabular-nums">
                    <span className="text-emerald-700">{item.availableCount}</span>
                    <span className="text-sm font-normal text-stone-400">
                      {' '}
                      / {item.totalCount} bays
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500">Daily Rate from</span>
                    {item.minDailyRate !== null ? (
                      <CurrencyText
                        amount={item.minDailyRate}
                        className="font-semibold text-stone-900"
                      />
                    ) : (
                      <span className="text-xs text-stone-400">No bays added yet</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500">Monthly (25× daily)</span>
                    {item.minMonthlyRate !== null ? (
                      <CurrencyText
                        amount={item.minMonthlyRate}
                        className="font-semibold text-stone-900"
                      />
                    ) : (
                      <span className="text-xs text-stone-400">—</span>
                    )}
                  </div>
                  {item.type === 'EV' ? (
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500">EV Charging from</span>
                      {item.minKwhRate !== null ? (
                        <span className="font-mono text-xs font-semibold text-cyan-800">
                          <CurrencyText amount={item.minKwhRate} /> / kWh
                        </span>
                      ) : (
                        <span className="text-xs text-stone-400">—</span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500">EV Charging</span>
                      <span className="text-xs text-stone-400">Not included</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
