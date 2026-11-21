'use client';

import { CalendarPlus, Zap } from 'lucide-react';
import { useActionState, useEffect, useMemo, useState } from 'react';
import { extendRentalAction } from '@/service/rental';
import { BayPlaque } from '@/app/_components/common/bay-plaque';
import { CurrencyText } from '@/app/_components/common/currency-text';
import { FileDropzone } from '@/app/_components/common/file-dropzone';
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
import { Separator } from '@/app/_components/ui/separator';
import { useExtensionCalculator, useImageUpload } from '@/hooks';
import { formatDate, toIsoDateInput } from '@/utils/format';
import type { ActionState } from '@/types';
import { DateCalculator } from '@/utils/date';
import type { RentalDetail } from '@/types';

const INITIAL_STATE: ActionState = { success: false };

/**
 * Modal dialog for extending an active rental's end date with live `remaining_cost`
 * preview and payment proof upload.
 */
export function ExtendRentalDialog({ rental }: { rental: RentalDetail }) {
  const [open, setOpen] = useState(false);

  const minNextDateIso = useMemo(() => {
    const nextDay = DateCalculator.addDays(new Date(rental.endDate), 1);
    return toIsoDateInput(nextDay);
  }, [rental.endDate]);

  const [newEndDateIso, setNewEndDateIso] = useState<string>(minNextDateIso);
  const upload = useImageUpload();
  const [state, formAction, isPending] = useActionState(
    extendRentalAction,
    INITIAL_STATE,
  );

  const calc = useExtensionCalculator({
    previousEndDate: rental.endDate,
    newEndDateIso,
    garageType: rental.garageType,
    dailyRate: rental.garageDailyRate,
    kwhRate: rental.garageKwhRate,
    vehicleType: rental.vehicleType,
    batteryKwh: rental.batteryKwh,
  });

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
        <Button type="button" size="sm" variant="default">
          <CalendarPlus className="h-3.5 w-3.5" />
          Extend
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Extend Bay <BayPlaque code={rental.garageCode} type={rental.garageType} size="sm" />
          </DialogTitle>
          <DialogDescription>
            {rental.tenantName} · {rental.brandModel}
            {rental.licensePlate ? ` (${rental.licensePlate})` : ''}
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="mt-4 space-y-4">
          <input type="hidden" name="rentalId" value={rental.rentalId} />

          {state.message ? (
            <Alert variant={state.success ? 'emerald' : 'rose'}>{state.message}</Alert>
          ) : null}

          <div className="grid grid-cols-2 gap-3 rounded-lg border border-stone-200 bg-stone-50 p-3 text-xs">
            <div>
              <span className="text-stone-500">Current End Date</span>
              <p className="mt-0.5 font-mono font-semibold text-stone-900">
                {formatDate(rental.endDate)}
              </p>
            </div>
            <div>
              <span className="text-stone-500">Bay Daily Rate</span>
              <p className="mt-0.5 font-semibold text-stone-900">
                <CurrencyText amount={rental.garageDailyRate} />
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`ext-date-${rental.rentalId}`}>New End Date</Label>
            <Input
              id={`ext-date-${rental.rentalId}`}
              name="newEndDate"
              type="date"
              min={minNextDateIso}
              required
              value={newEndDateIso}
              onChange={(e) => setNewEndDateIso(e.target.value)}
              className="font-mono"
            />
          </div>

          <div className="space-y-2 rounded-lg border border-stone-200 bg-white p-4 text-sm">
            <div className="flex justify-between text-xs text-stone-600">
              <span>Extension Span</span>
              <span className="font-mono font-medium text-stone-900">
                {calc.fullMonths > 0 ? `${calc.fullMonths} calendar month(s) ` : ''}
                {calc.remainingDays > 0 ? `${calc.remainingDays} day(s)` : ''}
                {calc.totalDays > 0 ? ` (${calc.totalDays}d total)` : ''}
              </span>
            </div>
            <div className="flex justify-between text-xs text-stone-600">
              <span>Rent Delta ({calc.fullMonths}×25 + {calc.remainingDays}×1 daily)</span>
              <CurrencyText amount={calc.baseCost} className="font-medium text-stone-900" />
            </div>
            {calc.chargingCost > 0 ? (
              <div className="flex justify-between text-xs text-cyan-800">
                <span className="inline-flex items-center gap-1">
                  <Zap className="h-3.5 w-3.5" />
                  EV Full Charge ({rental.batteryKwh} kWh)
                </span>
                <CurrencyText amount={calc.chargingCost} className="font-medium" />
              </div>
            ) : null}
            <Separator />
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-semibold uppercase text-stone-500">
                Remaining Cost Due
              </span>
              <CurrencyText
                amount={calc.remainingCost}
                className="text-lg font-bold text-amber-700"
              />
            </div>
            {calc.errorMessage ? (
              <p className="text-xs text-rose-600">{calc.errorMessage}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label>Extension Payment Proof</Label>
            <FileDropzone
              previewUrl={upload.previewUrl}
              fileName={upload.file?.name ?? null}
              error={upload.error ?? state.fieldErrors?.paymentProof?.[0] ?? null}
              onFileChange={upload.handleFileChange}
              onClear={upload.clearFile}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <SubmitButton
              pending={isPending}
              pendingLabel="Saving..."
              disabled={Boolean(calc.errorMessage) || !upload.file}
            >
              Confirm Extension
            </SubmitButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
