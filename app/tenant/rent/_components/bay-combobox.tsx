'use client';

import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { BayPlaque } from '@/app/_components/common/bay-plaque';
import { CurrencyText } from '@/app/_components/common/currency-text';
import { Input } from '@/app/_components/ui/input';
import { Label } from '@/app/_components/ui/label';
import { GARAGE_TYPE_SHORT_LABELS } from '@/utils/format';
import { cn } from '@/lib/utils';
import type { GarageItem, GarageType } from '@/types';

interface BayComboboxProps {
  availableGarages: GarageItem[];
  compatibleGarageTypes: GarageType[];
  selectedGarageType: GarageType;
  onGarageTypeChange: (type: GarageType) => void;
  selectedGarageCode: string;
  onSelectGarageCode: (code: string) => void;
  fieldError?: string;
}

/**
 * Searchable compatible bay selector list displaying available bays for today.
 */
export function BayCombobox({
  availableGarages,
  compatibleGarageTypes,
  selectedGarageType,
  onGarageTypeChange,
  selectedGarageCode,
  onSelectGarageCode,
  fieldError,
}: BayComboboxProps) {
  const [search, setSearch] = useState('');

  const matchingBays = useMemo(() => {
    const query = search.trim().toLowerCase();
    return availableGarages.filter((bay) => {
      if (bay.type !== selectedGarageType) return false;
      if (query && !bay.garageCode.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [availableGarages, search, selectedGarageType]);

  return (
    <div className="space-y-4">
      <input type="hidden" name="garageCode" value={selectedGarageCode} />

      <div className="space-y-1.5">
        <Label>Compatible Garage Type</Label>
        <div className="flex flex-wrap gap-2">
          {compatibleGarageTypes.map((gt) => {
            const count = availableGarages.filter((g) => g.type === gt).length;
            return (
              <button
                key={gt}
                type="button"
                onClick={() => onGarageTypeChange(gt)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer',
                  selectedGarageType === gt
                    ? 'border-amber-600 bg-amber-50 text-amber-950 ring-1 ring-amber-600'
                    : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50',
                )}
              >
                <span>{GARAGE_TYPE_SHORT_LABELS[gt]}</span>
                <span className="rounded bg-stone-200/80 px-1.5 py-0.5 font-mono text-[11px] text-stone-800">
                  {count} free
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bay-search">Available Bays Today</Label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <Input
            id="bay-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${GARAGE_TYPE_SHORT_LABELS[selectedGarageType]} code (e.g. C001)...`}
            className="pl-9 font-mono"
          />
        </div>

        <div className="max-h-56 overflow-y-auto rounded-xl border border-stone-200 bg-stone-50/50 divide-y divide-stone-200">
          {matchingBays.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-stone-500">
              No available {GARAGE_TYPE_SHORT_LABELS[selectedGarageType]}s found today.
            </div>
          ) : (
            matchingBays.map((bay) => {
              const selected = selectedGarageCode === bay.garageCode;
              return (
                <button
                  key={bay.garageCode}
                  type="button"
                  onClick={() => onSelectGarageCode(bay.garageCode)}
                  className={cn(
                    'flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors cursor-pointer',
                    selected ? 'bg-amber-50' : 'bg-white hover:bg-stone-50',
                  )}
                >
                  <div className="flex items-center gap-3">
                    <BayPlaque code={bay.garageCode} type={bay.type} size="sm" />
                    <span className="text-xs text-stone-600">
                      <CurrencyText amount={bay.dailyRate} className="font-semibold text-stone-900" />
                      /day
                      {bay.kwhRate ? (
                        <span className="ml-2 text-cyan-800">
                          · <CurrencyText amount={bay.kwhRate} />/kWh
                        </span>
                      ) : null}
                    </span>
                  </div>
                  <span
                    className={cn(
                      'text-xs font-semibold',
                      selected ? 'text-amber-700' : 'text-stone-400',
                    )}
                  >
                    {selected ? 'Selected' : 'Choose'}
                  </span>
                </button>
              );
            })
          )}
        </div>
        {fieldError ? <p className="text-xs text-rose-600">{fieldError}</p> : null}
      </div>
    </div>
  );
}
