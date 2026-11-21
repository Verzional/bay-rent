import {
  ArrowRight,
  CalendarClock,
  ShieldCheck,
  TrendingUp,
  Warehouse,
} from 'lucide-react';
import Link from 'next/link';
import { CurrencyText } from '@/app/_components/common/currency-text';
import { KpiCard } from '@/app/_components/common/kpi-card';
import { PageHeader } from '@/app/_components/common/page-header';
import { Button } from '@/app/_components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { requireAdmin } from '@/lib/session';
import { getAdminDashboardOverview } from '@/service/report';

/**
 * Admin operations dashboard landing view.
 */
export default async function AdminOverviewPage() {
  await requireAdmin();
  const overview = await getAdminDashboardOverview();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Operations Console"
        title="Facility Overview"
        description="Live bay occupancy, pending KTP verifications, active rentals, and current-month revenue."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total Garage Bays"
          value={overview.totalGarages}
          hint={`${overview.availableGarages} available · ${overview.usedGarages} used`}
          icon={<Warehouse className="h-4 w-4" />}
          accent="default"
        />
        <KpiCard
          label="Occupancy Rate"
          value={`${overview.occupancyRate}%`}
          hint={`${overview.activeRentalsToday} active rental(s) today`}
          icon={<CalendarClock className="h-4 w-4" />}
          accent="emerald"
        />
        <KpiCard
          label="Pending Verifications"
          value={overview.pendingVerifications}
          hint="New tenant KTP reviews"
          icon={<ShieldCheck className="h-4 w-4" />}
          accent="amber"
        />
        <KpiCard
          label="This Month Revenue"
          value={<CurrencyText amount={overview.currentMonthRevenue} />}
          hint="Initial bookings + extensions"
          icon={<TrendingUp className="h-4 w-4" />}
          accent="cyan"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Bay Inventory &amp; Batch Creation</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <p className="text-sm text-stone-600">
              Generate numbered Bicycle (`S###`), Car (`C###`), or EV (`E###`) bays up to
              999 per category.
            </p>
            <Button asChild variant="outline" size="sm" className="shrink-0">
              <Link href="/admin/garages">
                Open Garages
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tenant KTP Verification Queue</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <p className="text-sm text-stone-600">
              Review 16-digit NIK registrations and approve or reject tenant booking access.
            </p>
            <Button asChild variant="outline" size="sm" className="shrink-0">
              <Link href="/admin/verifications">
                Review Queue
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Rentals &amp; Extensions</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <p className="text-sm text-stone-600">
              Inspect bays rented today, extend end dates with remaining cost preview, or
              release bays early.
            </p>
            <Button asChild variant="outline" size="sm" className="shrink-0">
              <Link href="/admin/rentals">
                Manage Rentals
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>4-View Rental Analytics</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <p className="text-sm text-stone-600">
              Analyze revenue and volume by month, day, garage category, and individual
              tenant.
            </p>
            <Button asChild variant="outline" size="sm" className="shrink-0">
              <Link href="/admin/reports">
                View Reports
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
