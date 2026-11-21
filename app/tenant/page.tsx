import { Car, PlusCircle, Warehouse } from 'lucide-react';
import Link from 'next/link';
import { EmptyState } from '@/app/_components/common/empty-state';
import { PageHeader } from '@/app/_components/common/page-header';
import { Button } from '@/app/_components/ui/button';
import { requireTenant } from '@/lib/session';
import { listTenantRentals, listTenantVehicles } from '@/service/rental';
import { BayPassCard } from './_components/bay-pass-card';
import { RentalHistoryTable } from './_components/rental-history-table';
import { VehicleList } from './_components/vehicle-list';
import { VerificationBanner } from './_components/verification-banner';

/**
 * Tenant dashboard showing verification status, active bay passes, and history.
 */
export default async function TenantPage() {
  const user = await requireTenant();
  const [rentals, vehicles] = await Promise.all([
    listTenantRentals(),
    listTenantVehicles(),
  ]);

  const activeRentals = rentals.filter((r) => r.status === 'ACTIVE');
  const isAccepted = user.verificationStatus === 'ACCEPTED';

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Tenant Portal"
        title={`Welcome, ${user.fullName}`}
        description="Manage your active bay passes, registered vehicles, and rental receipts."
        actions={
          isAccepted ? (
            <Button asChild>
              <Link href="/tenant/rent">
                <PlusCircle className="h-4 w-4" />
                Rent a Bay
              </Link>
            </Button>
          ) : undefined
        }
      />

      <VerificationBanner status={user.verificationStatus} />

      {isAccepted ? (
        <>
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-stone-900">
              Active Bay Passes ({activeRentals.length})
            </h2>

            {activeRentals.length === 0 ? (
              <EmptyState
                icon={<Warehouse className="h-5 w-5" />}
                title="No Active Bay Rentals"
                description="You currently have no occupied garage bays. Book a bay for your bicycle, motorcycle, car, or EV."
                action={
                  <Button asChild>
                    <Link href="/tenant/rent">Rent a Garage Bay</Link>
                  </Button>
                }
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {activeRentals.map((rental) => (
                  <BayPassCard key={rental.rentalId} rental={rental} />
                ))}
              </div>
            )}
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-stone-900">
              Registered Vehicles ({vehicles.length})
            </h2>
            {vehicles.length === 0 ? (
              <EmptyState
                icon={<Car className="h-5 w-5" />}
                title="No Vehicles Saved Yet"
                description="Vehicles are automatically saved to your profile when you confirm your first bay rental."
              />
            ) : (
              <VehicleList vehicles={vehicles} activeRentals={activeRentals} />
            )}
          </section>

          {rentals.length > 0 ? (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-stone-900">Rental History</h2>
              <RentalHistoryTable rentals={rentals} />
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
