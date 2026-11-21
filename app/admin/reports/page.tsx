import { PageHeader } from '@/app/_components/common/page-header';
import { requireAdmin } from '@/lib/session';
import {
  getByGarageTypeReport,
  getByTenantReport,
  getDailyReport,
  getMonthlyReport,
} from '@/service/report';
import type { ReportTabKey } from '@/types';
import { DateCalculator } from '@/utils/date';
import { ReportsView } from './_components/reports-view';

const VALID_TABS = new Set<ReportTabKey>(['monthly', 'daily', 'by-type', 'by-tenant']);

/**
 * Admin 4-view rental analytics and revenue reporting page.
 */
export default async function AdminReportsPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const params = await props.searchParams;

  const today = DateCalculator.today();
  const defaultYear = today.getUTCFullYear();
  const defaultMonth = today.getUTCMonth() + 1;

  const rawTab = typeof params.tab === 'string' ? (params.tab as ReportTabKey) : 'monthly';
  const activeTab: ReportTabKey = VALID_TABS.has(rawTab) ? rawTab : 'monthly';

  const parsedYear = Number(params.year);
  const selectedYear =
    Number.isInteger(parsedYear) && parsedYear >= 2000 && parsedYear <= 2100
      ? parsedYear
      : defaultYear;

  const parsedMonth = Number(params.month);
  const selectedMonth =
    Number.isInteger(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12
      ? parsedMonth
      : defaultMonth;

  const [monthlyRows, dailyRows, byTypeRows, byTenantRows] = await Promise.all([
    getMonthlyReport(selectedYear),
    getDailyReport(selectedYear, selectedMonth),
    getByGarageTypeReport(),
    getByTenantReport(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Analytics"
        title="Rental Reports"
        description="Inspect rental performance by month in a year, day in a month, garage type, and tenant."
      />

      <ReportsView
        activeTab={activeTab}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        monthlyRows={monthlyRows}
        dailyRows={dailyRows}
        byTypeRows={byTypeRows}
        byTenantRows={byTenantRows}
      />
    </div>
  );
}
