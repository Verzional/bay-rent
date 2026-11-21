import { PageHeader } from '@/app/_components/common/page-header';
import { requireAdmin } from '@/lib/session';
import { listActiveRentalsToday } from '@/service/rental';
import { ActiveRentalsTable } from './_components/active-rentals-table';

/**
 * Admin active rentals & extension management page.
 */
export default async function AdminRentalsPage() {
  await requireAdmin();
  const activeRentals = await listActiveRentalsToday();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operations"
        title="Active Rentals"
        description="Extend end dates with automated remaining cost calculation, view payment proofs, or mark rentals complete."
      />

      <ActiveRentalsTable rentals={activeRentals} />
    </div>
  );
}
