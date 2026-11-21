import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/app/_components/common/page-header';
import { Button } from '@/app/_components/ui/button';
import { requireTenant } from '@/lib/session';
import { listAvailableGaragesForToday } from '@/service/garage';
import { listTenantRentals, listTenantVehicles } from '@/service/rental';
import { VerificationBanner } from '../_components/verification-banner';
import { BookingForm } from './_components/booking-form';

/**
 * Tenant bay checkout page with two-column booking form and live receipt.
 */
export default async function RentBayPage() {
  const user = await requireTenant();

  if (user.verificationStatus !== 'ACCEPTED') {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Rent a Bay"
          title="Verification Required"
          actions={
            <Button asChild variant="outline">
              <Link href="/tenant">
                <ArrowLeft className="h-4 w-4" />
                Back to Portal
              </Link>
            </Button>
          }
        />
        <VerificationBanner status={user.verificationStatus} />
      </div>
    );
  }

  const [vehicles, rentals, availableGarages] = await Promise.all([
    listTenantVehicles(),
    listTenantRentals(),
    listAvailableGaragesForToday(),
  ]);

  const activeVehicleIds = rentals
    .filter((r) => r.status === 'ACTIVE')
    .map((r) => r.vehicleId);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="New Booking"
        title="Rent a Garage Bay"
        description="Start date is locked to today. Select a vehicle, pick a compatible available bay, and upload your payment proof."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/tenant">
              <ArrowLeft className="h-4 w-4" />
              Back to My Bays
            </Link>
          </Button>
        }
      />

      <BookingForm
        vehicles={vehicles}
        activeVehicleIds={activeVehicleIds}
        availableGarages={availableGarages}
      />
    </div>
  );
}
