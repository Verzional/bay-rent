'use client';

import { Plus } from 'lucide-react';
import { useActionState, useEffect, useState } from 'react';
import { batchCreateGaragesAction } from '@/service/garage';
import { BayPlaque } from '@/app/_components/common/bay-plaque';
import { SubmitButton } from '@/app/_components/common/submit-button';
import { Alert } from '@/app/_components/ui/alert';
import { Button } from '@/app/_components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/app/_components/ui/dialog';
import { Input } from '@/app/_components/ui/input';
import { Label } from '@/app/_components/ui/label';
import { useBatchGaragePreview } from '@/hooks';
import { cn } from '@/lib/utils';
import type { ActionState } from '@/types';
import type { BatchCreateGarageResult, GarageType } from '@/types';

const INITIAL_STATE: ActionState<BatchCreateGarageResult> = { success: false };

/**
 * Modal form allowing Admin to batch-generate sequential garage bays (max 999 per type).
 */
export function BatchCreateGarageDialog({
  maxSequenceByType,
}: {
  maxSequenceByType: Record<GarageType, number>;
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<GarageType>('CAR');
  const [quantity, setQuantity] = useState<number>(5);
  const [dailyRate, setDailyRate] = useState<string>('50000');
  const [kwhRate, setKwhRate] = useState<string>('2500');

  const [state, formAction, isPending] = useActionState(
    batchCreateGaragesAction,
    INITIAL_STATE,
  );

  const preview = useBatchGaragePreview(type, quantity, maxSequenceByType);

  useEffect(() => {
    if (state.success) {
      const timer = setTimeout(() => setOpen(false), 600);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          Batch Create Bays
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Batch Create Garage Bays</DialogTitle>
          <DialogDescription>
            Codes are generated incrementally per type (`S###`, `C###`, `E###`), up to
            999 bays total per category.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="mt-4 space-y-4">
          {state.message ? (
            <Alert variant={state.success ? 'emerald' : 'rose'}>{state.message}</Alert>
          ) : null}

          <input type="hidden" name="type" value={type} />
          <div className="space-y-1.5">
            <Label>Garage Type</Label>
            <div className="grid grid-cols-3 gap-2">
              {(['BICYCLE', 'CAR', 'EV'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={cn(
                    'rounded-lg border px-3 py-2 text-xs font-semibold transition-all cursor-pointer',
                    type === t
                      ? 'border-amber-600 bg-amber-50 text-amber-950 ring-1 ring-amber-600'
                      : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50',
                  )}
                >
                  {t === 'BICYCLE' ? 'Bicycle (S)' : t === 'CAR' ? 'Car (C)' : 'EV (E)'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="batch-quantity">Quantity (max 999)</Label>
              <Input
                id="batch-quantity"
                name="quantity"
                type="number"
                min={1}
                max={999}
                required
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value) || 0)}
                className="font-mono"
              />
              {state.fieldErrors?.quantity ? (
                <p className="text-xs text-rose-600">{state.fieldErrors.quantity[0]}</p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="batch-daily-rate">Daily Rate (IDR)</Label>
              <Input
                id="batch-daily-rate"
                name="dailyRate"
                type="number"
                min={1000}
                step={500}
                required
                value={dailyRate}
                onChange={(e) => setDailyRate(e.target.value)}
                className="font-mono"
              />
              {state.fieldErrors?.dailyRate ? (
                <p className="text-xs text-rose-600">{state.fieldErrors.dailyRate[0]}</p>
              ) : null}
            </div>
          </div>

          {type === 'EV' ? (
            <div className="space-y-1.5">
              <Label htmlFor="batch-kwh-rate">Electricity Charging Rate (IDR / kWh)</Label>
              <Input
                id="batch-kwh-rate"
                name="kwhRate"
                type="number"
                min={100}
                step={100}
                required
                value={kwhRate}
                onChange={(e) => setKwhRate(e.target.value)}
                className="font-mono"
              />
              {state.fieldErrors?.kwhRate ? (
                <p className="text-xs text-rose-600">{state.fieldErrors.kwhRate[0]}</p>
              ) : null}
            </div>
          ) : null}

          <div className="rounded-lg border border-stone-200 bg-stone-50 p-3 text-xs">
            {preview.exceedsCapacity ? (
              <p className="font-medium text-rose-700">
                Exceeds 999-bay cap. Only {preview.remainingCapacity} slots remain for{' '}
                {type}.
              </p>
            ) : preview.firstCode && preview.lastCode ? (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-stone-600">Generated Code Preview:</span>
                <div className="flex items-center gap-1.5">
                  <BayPlaque code={preview.firstCode} type={type} size="sm" />
                  <span className="text-stone-400">→</span>
                  <BayPlaque code={preview.lastCode} type={type} size="sm" />
                </div>
              </div>
            ) : (
              <span className="text-stone-500">Enter a valid quantity to preview codes.</span>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <SubmitButton
              pending={isPending}
              pendingLabel="Generating..."
              disabled={preview.exceedsCapacity || quantity < 1}
            >
              Generate Bays
            </SubmitButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
