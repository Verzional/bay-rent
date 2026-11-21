'use client';

import { useActionState, useMemo, useState } from 'react';
import { createRentalAction } from '@/service/rental';
import { FileDropzone } from '@/app/_components/common/file-dropzone';
import { Alert } from '@/app/_components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { Input } from '@/app/_components/ui/input';
import { Label } from '@/app/_components/ui/label';
import { useBookingCalculator, useImageUpload } from '@/hooks';
import { cn } from '@/lib/utils';
import type { ActionState, VehicleInputMode } from '@/types';
import { PricingStrategyFactory } from '@/service/pricing';
import { DateCalculator } from '@/utils/date';
import type {
  GarageItem,
  GarageType,
  RentalType,
  VehicleItem,
  VehicleType,
} from '@/types';
import { BayCombobox } from './bay-combobox';
import { CostReceiptCard } from './cost-receipt-card';
import { VehicleSelectorSection } from './vehicle-selector-section';

const INITIAL_STATE: ActionState = { success: false };

interface BookingFormProps {
  vehicles: VehicleItem[];
  activeVehicleIds: number[];
  availableGarages: GarageItem[];
}

/**
 * Two-column Rent a Bay checkout orchestrating vehicle selection, compatible bay
 * lookup, daily/monthly intervals, live cost calculation, and payment proof upload.
 */
export function BookingForm({
  vehicles,
  activeVehicleIds,
  availableGarages,
}: BookingFormProps) {
  const [state, formAction, isPending] = useActionState(createRentalAction, INITIAL_STATE);
  const activeSet = useMemo(() => new Set(activeVehicleIds), [activeVehicleIds]);

  const [vehicleMode, setVehicleMode] = useState<VehicleInputMode>('new');
  const [existingVehicleId, setExistingVehicleId] = useState<string>(() => {
    const firstIdle = vehicles.find((v) => !activeSet.has(v.vehicleId));
    return firstIdle ? String(firstIdle.vehicleId) : '';
  });
  const [newVehicleType, setNewVehicleType] = useState<VehicleType>('CAR');
  const [licensePlate, setLicensePlate] = useState('');
  const [brandModel, setBrandModel] = useState('');
  const [batteryKwh, setBatteryKwh] = useState('');

  const [selectedGarageType, setSelectedGarageType] = useState<GarageType>('CAR');
  const [selectedGarageCode, setSelectedGarageCode] = useState<string>(() => {
    return availableGarages.find((g) => g.type === 'CAR')?.garageCode ?? '';
  });
  const [rentalType, setRentalType] = useState<RentalType>('DAILY');
  const [daysCountInput, setDaysCountInput] = useState<string>('7');
  const daysCount = daysCountInput.trim() === '' ? 0 : Number(daysCountInput);

  const upload = useImageUpload();

  const selectedExistingVehicle = useMemo(
    () => vehicles.find((v) => String(v.vehicleId) === existingVehicleId) ?? null,
    [existingVehicleId, vehicles],
  );

  const selectedGarage = useMemo(
    () => availableGarages.find((g) => g.garageCode === selectedGarageCode) ?? null,
    [availableGarages, selectedGarageCode],
  );

  const syncCompatibleGarageForVehicle = (vehicleType: VehicleType) => {
    const compatible = PricingStrategyFactory.getCompatibleGarageTypes(vehicleType);
    const nextType = compatible.includes(selectedGarageType)
      ? selectedGarageType
      : (compatible[0] ?? 'CAR');
    setSelectedGarageType(nextType);
    const firstAvailable = availableGarages.find((g) => g.type === nextType);
    setSelectedGarageCode(firstAvailable?.garageCode ?? '');
  };

  const handleVehicleModeChange = (mode: VehicleInputMode) => {
    setVehicleMode(mode);
    const nextType =
      mode === 'existing'
        ? (selectedExistingVehicle?.type ?? 'CAR')
        : newVehicleType;
    syncCompatibleGarageForVehicle(nextType);
  };

  const handleExistingVehicleChange = (id: string) => {
    setExistingVehicleId(id);
    const found = vehicles.find((v) => String(v.vehicleId) === id);
    if (found) {
      syncCompatibleGarageForVehicle(found.type);
    }
  };

  const handleNewVehicleTypeChange = (type: VehicleType) => {
    setNewVehicleType(type);
    syncCompatibleGarageForVehicle(type);
  };

  const handleGarageTypeChange = (type: GarageType) => {
    setSelectedGarageType(type);
    const firstAvailable = availableGarages.find((g) => g.type === type);
    setSelectedGarageCode(firstAvailable?.garageCode ?? '');
  };

  const calculator = useBookingCalculator({
    vehicleMode,
    existingVehicleType: selectedExistingVehicle?.type ?? null,
    existingVehicleBatteryKwh: selectedExistingVehicle?.batteryKwh ?? null,
    newVehicleType,
    newVehicleBatteryKwh: batteryKwh,
    selectedGarageType,
    selectedGarageDailyRate: selectedGarage?.dailyRate ?? null,
    selectedGarageKwhRate: selectedGarage?.kwhRate ?? null,
    rentalType,
    daysCount,
  });

  const startDate = DateCalculator.today();
  const startDateIso = DateCalculator.formatIsoDate(startDate);
  const maxDailyDays = DateCalculator.getMaxDailyDays(startDate);

  return (
    <form action={formAction} className="grid gap-6 lg:grid-cols-12">
      <div className="space-y-6 lg:col-span-7">
        {state.message && !state.success ? (
          <Alert variant="rose">{state.message}</Alert>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">1. Vehicle Details</CardTitle>
          </CardHeader>
          <CardContent>
            <VehicleSelectorSection
              vehicles={vehicles}
              activeVehicleIds={activeSet}
              vehicleMode={vehicleMode}
              onVehicleModeChange={handleVehicleModeChange}
              existingVehicleId={existingVehicleId}
              onExistingVehicleChange={handleExistingVehicleChange}
              newVehicleType={newVehicleType}
              onNewVehicleTypeChange={handleNewVehicleTypeChange}
              licensePlate={licensePlate}
              onLicensePlateChange={setLicensePlate}
              brandModel={brandModel}
              onBrandModelChange={setBrandModel}
              batteryKwh={batteryKwh}
              onBatteryKwhChange={setBatteryKwh}
              fieldErrors={state.fieldErrors}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">2. Choose Compatible Bay</CardTitle>
          </CardHeader>
          <CardContent>
            <BayCombobox
              availableGarages={availableGarages}
              compatibleGarageTypes={calculator.compatibleGarageTypes}
              selectedGarageType={selectedGarageType}
              onGarageTypeChange={handleGarageTypeChange}
              selectedGarageCode={selectedGarageCode}
              onSelectGarageCode={setSelectedGarageCode}
              fieldError={state.fieldErrors?.garageCode?.[0]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">3. Rental Duration &amp; Payment Proof</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <input type="hidden" name="rentalType" value={rentalType} />
            <div className="space-y-1.5">
              <Label>Rental Plan</Label>
              <div className="grid grid-cols-2 gap-2">
                {(['DAILY', 'MONTHLY'] as const).map((rt) => (
                  <button
                    key={rt}
                    type="button"
                    onClick={() => setRentalType(rt)}
                    className={cn(
                      'rounded-lg border px-4 py-2.5 text-left transition-all cursor-pointer',
                      rentalType === rt
                        ? 'border-amber-600 bg-amber-50 text-amber-950 ring-1 ring-amber-600'
                        : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50',
                    )}
                  >
                    <div className="text-sm font-semibold">
                      {rt === 'DAILY'
                        ? `Daily (1–${maxDailyDays} days)`
                        : 'Monthly (Calendar Month)'}
                    </div>
                    <div className="text-xs text-stone-500">
                      {rt === 'DAILY' ? '1× daily rate per day' : 'Discounted 25× daily rate'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {rentalType === 'DAILY' ? (
              <div className="space-y-1.5">
                <Label htmlFor="daysCount">Number of Days (1–{maxDailyDays})</Label>
                <Input
                  id="daysCount"
                  name="daysCount"
                  type="number"
                  min={1}
                  max={maxDailyDays}
                  required
                  value={daysCountInput}
                  onChange={(e) => setDaysCountInput(e.target.value)}
                  className="font-mono max-w-44"
                />
                {state.fieldErrors?.daysCount ? (
                  <p className="text-xs text-rose-600">{state.fieldErrors.daysCount[0]}</p>
                ) : null}
              </div>
            ) : null}

            <div className="space-y-1.5">
              <Label>Payment Confirmation Proof</Label>
              <FileDropzone
                previewUrl={upload.previewUrl}
                fileName={upload.file?.name ?? null}
                error={upload.error ?? state.fieldErrors?.paymentProof?.[0] ?? null}
                onFileChange={upload.handleFileChange}
                onClear={upload.clearFile}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-5">
        <CostReceiptCard
          selectedGarage={selectedGarage}
          rentalType={rentalType}
          daysCount={daysCount}
          startDateIso={startDateIso}
          calculator={calculator}
          hasPaymentProof={Boolean(upload.file)}
          isSubmitting={isPending}
        />
      </div>
    </form>
  );
}
