'use client';

import { Input } from '@/app/_components/ui/input';
import { Label } from '@/app/_components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/_components/ui/select';
import { VEHICLE_TYPE_LABELS } from '@/utils/format';
import { cn } from '@/lib/utils';
import type { VehicleInputMode } from '@/types';
import type { VehicleItem, VehicleType } from '@/types';

interface VehicleSelectorSectionProps {
  vehicles: VehicleItem[];
  activeVehicleIds: Set<number>;
  vehicleMode: VehicleInputMode;
  onVehicleModeChange: (mode: VehicleInputMode) => void;
  existingVehicleId: string;
  onExistingVehicleChange: (id: string) => void;
  newVehicleType: VehicleType;
  onNewVehicleTypeChange: (type: VehicleType) => void;
  licensePlate: string;
  onLicensePlateChange: (plate: string) => void;
  brandModel: string;
  onBrandModelChange: (brand: string) => void;
  batteryKwh: string;
  onBatteryKwhChange: (kwh: string) => void;
  fieldErrors?: Record<string, string[]>;
}

const VEHICLE_TYPES: VehicleType[] = ['BICYCLE', 'MOTORCYCLE', 'CAR', 'EV'];

/**
 * Vehicle selection step inside the Rent a Bay checkout form, supporting
 * either previously saved vehicles or registering a new vehicle inline.
 */
export function VehicleSelectorSection({
  vehicles,
  activeVehicleIds,
  vehicleMode,
  onVehicleModeChange,
  existingVehicleId,
  onExistingVehicleChange,
  newVehicleType,
  onNewVehicleTypeChange,
  licensePlate,
  onLicensePlateChange,
  brandModel,
  onBrandModelChange,
  batteryKwh,
  onBatteryKwhChange,
  fieldErrors,
}: VehicleSelectorSectionProps) {
  const selectableVehicles = vehicles.filter((v) => !activeVehicleIds.has(v.vehicleId));

  return (
    <div className="space-y-4">
      <input type="hidden" name="vehicleMode" value={vehicleMode} />

      {vehicles.length > 0 ? (
        <div className="inline-flex rounded-lg border border-stone-200 bg-stone-100 p-1">
          <button
            type="button"
            onClick={() => onVehicleModeChange('new')}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer',
              vehicleMode === 'new'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900',
            )}
          >
            New Vehicle
          </button>
          <button
            type="button"
            onClick={() => onVehicleModeChange('existing')}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer',
              vehicleMode === 'existing'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900',
            )}
          >
            Saved Vehicle ({selectableVehicles.length} idle)
          </button>
        </div>
      ) : null}

      {vehicleMode === 'existing' ? (
        <div className="space-y-2">
          <input type="hidden" name="existingVehicleId" value={existingVehicleId} />
          <Label htmlFor="saved-vehicle-select">Select Idle Vehicle</Label>
          {selectableVehicles.length === 0 ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              All of your registered vehicles are currently parked in active bays.
              Switch to &ldquo;New Vehicle&rdquo; to rent another bay.
            </p>
          ) : (
            <Select value={existingVehicleId} onValueChange={onExistingVehicleChange}>
              <SelectTrigger id="saved-vehicle-select">
                <SelectValue placeholder="Choose one of your idle vehicles" />
              </SelectTrigger>
              <SelectContent>
                {selectableVehicles.map((v) => (
                  <SelectItem key={v.vehicleId} value={String(v.vehicleId)}>
                    {v.brandModel} ({VEHICLE_TYPE_LABELS[v.type]}
                    {v.licensePlate ? ` · ${v.licensePlate}` : ''}
                    {v.batteryKwh ? ` · ${v.batteryKwh} kWh` : ''})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {fieldErrors?.existingVehicleId ? (
            <p className="text-xs text-rose-600">{fieldErrors.existingVehicleId[0]}</p>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <input type="hidden" name="newVehicleType" value={newVehicleType} />
            <Label>Vehicle Type</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {VEHICLE_TYPES.map((vt) => (
                <button
                  key={vt}
                  type="button"
                  onClick={() => onNewVehicleTypeChange(vt)}
                  className={cn(
                    'rounded-lg border px-3 py-2 text-left text-xs font-semibold transition-all cursor-pointer',
                    newVehicleType === vt
                      ? 'border-amber-600 bg-amber-50 text-amber-950 ring-1 ring-amber-600'
                      : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50',
                  )}
                >
                  {vt === 'MOTORCYCLE'
                    ? 'Motorcycle'
                    : vt === 'BICYCLE'
                      ? 'Bicycle'
                      : vt === 'CAR'
                        ? 'Car'
                        : 'EV'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="brandModel">Brand &amp; Model</Label>
            <Input
              id="brandModel"
              name="brandModel"
              required={vehicleMode === 'new'}
              value={brandModel}
              onChange={(e) => onBrandModelChange(e.target.value)}
              placeholder={
                newVehicleType === 'BICYCLE'
                  ? 'Polygon Strattos S5'
                  : newVehicleType === 'EV'
                    ? 'Hyundai Ioniq 5'
                    : 'Honda Civic RS'
              }
            />
            {fieldErrors?.['newVehicle.brandModel'] ? (
              <p className="text-xs text-rose-600">
                {fieldErrors['newVehicle.brandModel'][0]}
              </p>
            ) : null}
          </div>

          {newVehicleType !== 'BICYCLE' ? (
            <div className="space-y-1.5">
              <Label htmlFor="licensePlate">License Plate</Label>
              <Input
                id="licensePlate"
                name="licensePlate"
                required
                value={licensePlate}
                onChange={(e) => onLicensePlateChange(e.target.value.toUpperCase())}
                placeholder="L 1234 AB"
                className="font-mono uppercase"
              />
              {fieldErrors?.['newVehicle.licensePlate'] ? (
                <p className="text-xs text-rose-600">
                  {fieldErrors['newVehicle.licensePlate'][0]}
                </p>
              ) : null}
            </div>
          ) : (
            <input type="hidden" name="licensePlate" value="" />
          )}

          {newVehicleType === 'EV' ? (
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="batteryKwh">Battery Capacity (kWh)</Label>
              <Input
                id="batteryKwh"
                name="batteryKwh"
                type="number"
                step="0.1"
                min="1"
                required
                value={batteryKwh}
                onChange={(e) => onBatteryKwhChange(e.target.value)}
                placeholder="60"
                className="font-mono"
              />
              {fieldErrors?.['newVehicle.batteryKwh'] ? (
                <p className="text-xs text-rose-600">
                  {fieldErrors['newVehicle.batteryKwh'][0]}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
