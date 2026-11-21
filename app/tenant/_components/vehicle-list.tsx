import { Bike, CarFront, Zap } from 'lucide-react';
import { Badge } from '@/app/_components/ui/badge';
import { Card, CardContent } from '@/app/_components/ui/card';
import { VEHICLE_TYPE_LABELS } from '@/utils/format';
import type { RentalDetail, VehicleItem } from '@/types';

/**
 * Displays the tenant's saved vehicles and marks any vehicle currently parked in an active bay.
 */
export function VehicleList({
  vehicles,
  activeRentals,
}: {
  vehicles: VehicleItem[];
  activeRentals: RentalDetail[];
}) {
  const activeByVehicle = new Map(activeRentals.map((r) => [r.vehicleId, r.garageCode]));

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {vehicles.map((vehicle) => {
        const activeBay = activeByVehicle.get(vehicle.vehicleId);
        const Icon =
          vehicle.type === 'EV'
            ? Zap
            : vehicle.type === 'CAR'
              ? CarFront
              : Bike;

        return (
          <Card key={vehicle.vehicleId}>
            <CardContent className="flex items-start justify-between gap-3 p-4 sm:p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-lg border border-stone-200 bg-stone-50 p-2 text-stone-700">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-stone-900">
                      {vehicle.brandModel}
                    </p>
                    {vehicle.licensePlate ? (
                      <Badge variant="neutral" className="font-mono">
                        {vehicle.licensePlate}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="text-xs text-stone-500">
                      {VEHICLE_TYPE_LABELS[vehicle.type]}
                    </p>
                    {vehicle.batteryKwh ? (
                      <Badge variant="cyan" className="font-mono">
                        {vehicle.batteryKwh} kWh
                      </Badge>
                    ) : null}
                  </div>
                </div>
              </div>
              {activeBay ? (
                <Badge variant="emerald" className="font-mono">
                  In {activeBay}
                </Badge>
              ) : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
