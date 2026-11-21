'use client';

import { useRouter } from 'next/navigation';
import { CurrencyText } from '@/app/_components/common/currency-text';
import { KpiCard } from '@/app/_components/common/kpi-card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/_components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/_components/ui/tabs';
import { GARAGE_TYPE_SHORT_LABELS } from '@/utils/format';
import type { ReportTabKey } from '@/types';
import type {
  DailyReportRow,
  GarageTypeReportRow,
  MonthlyReportRow,
  TenantReportRow,
} from '@/types';
import { ReportChartCard } from './report-chart-card';
import {
  DailyReportTable,
  GarageTypeReportTable,
  MonthlyReportTable,
  TenantReportTable,
} from './report-data-table';

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

interface ReportsViewProps {
  activeTab: ReportTabKey;
  selectedYear: number;
  selectedMonth: number;
  monthlyRows: MonthlyReportRow[];
  dailyRows: DailyReportRow[];
  byTypeRows: GarageTypeReportRow[];
  byTenantRows: TenantReportRow[];
}

/**
 * Interactive 4-tab Admin Rental Reports view with year/month query navigation,
 * KPI summary cards, Recharts visualizations, and detailed tables.
 */
export function ReportsView({
  activeTab,
  selectedYear,
  selectedMonth,
  monthlyRows,
  dailyRows,
  byTypeRows,
  byTenantRows,
}: ReportsViewProps) {
  const router = useRouter();
  const years = [selectedYear - 1, selectedYear, selectedYear + 1];

  const navigate = (tab: ReportTabKey, year: number, month: number) => {
    router.push(`/admin/reports?tab=${tab}&year=${year}&month=${month}`);
  };

  const annualTotalRevenue = monthlyRows.reduce((s, r) => s + r.totalRevenue, 0);
  const annualRentals = monthlyRows.reduce((s, r) => s + r.rentalCount, 0);
  const monthTotalRevenue = dailyRows.reduce((s, r) => s + r.totalRevenue, 0);
  const monthRentals = dailyRows.reduce((s, r) => s + r.rentalCount, 0);

  return (
    <Tabs
      value={activeTab}
      onValueChange={(val) => navigate(val as ReportTabKey, selectedYear, selectedMonth)}
      className="space-y-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <TabsList>
          <TabsTrigger value="monthly">Monthly by Year</TabsTrigger>
          <TabsTrigger value="daily">Daily by Month</TabsTrigger>
          <TabsTrigger value="by-type">By Garage Type</TabsTrigger>
          <TabsTrigger value="by-tenant">By Tenant</TabsTrigger>
        </TabsList>

        <div className="flex items-center gap-2">
          {(activeTab === 'monthly' || activeTab === 'daily') && (
            <div className="w-28">
              <Select
                value={String(selectedYear)}
                onValueChange={(val) => navigate(activeTab, Number(val), selectedMonth)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((yr) => (
                    <SelectItem key={yr} value={String(yr)}>
                      {yr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {activeTab === 'daily' && (
            <div className="w-36">
              <Select
                value={String(selectedMonth)}
                onValueChange={(val) => navigate(activeTab, selectedYear, Number(val))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => (
                    <SelectItem key={m.value} value={String(m.value)}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      <TabsContent value="monthly" className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <KpiCard
            label={`${selectedYear} Total Revenue`}
            value={<CurrencyText amount={annualTotalRevenue} />}
            accent="amber"
          />
          <KpiCard
            label={`${selectedYear} New Rentals`}
            value={annualRentals}
            accent="default"
          />
        </div>
        <ReportChartCard
          title={`Monthly Rental Revenue (${selectedYear})`}
          subtitle="Initial rental bookings + extension fees aggregated per calendar month"
          data={monthlyRows.map((r) => ({
            label: r.monthLabel,
            revenue: r.totalRevenue,
            rentals: r.rentalCount,
          }))}
        />
        <MonthlyReportTable rows={monthlyRows} />
      </TabsContent>

      <TabsContent value="daily" className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <KpiCard
            label={`${MONTHS[selectedMonth - 1]?.label ?? ''} ${selectedYear} Revenue`}
            value={<CurrencyText amount={monthTotalRevenue} />}
            accent="amber"
          />
          <KpiCard
            label={`${MONTHS[selectedMonth - 1]?.label ?? ''} New Rentals`}
            value={monthRentals}
            accent="default"
          />
        </div>
        <ReportChartCard
          title={`Daily Revenue — ${MONTHS[selectedMonth - 1]?.label ?? ''} ${selectedYear}`}
          subtitle="Daily breakdown of new rentals and extension collections"
          data={dailyRows.map((r) => ({
            label: String(r.day),
            revenue: r.totalRevenue,
            rentals: r.rentalCount,
          }))}
        />
        <DailyReportTable rows={dailyRows} />
      </TabsContent>

      <TabsContent value="by-type" className="space-y-5">
        <ReportChartCard
          title="Revenue by Garage Type"
          subtitle="Lifetime initial and extension revenue grouped by bay category"
          data={byTypeRows.map((r) => ({
            label: GARAGE_TYPE_SHORT_LABELS[r.garageType],
            revenue: r.totalRevenue,
            rentals: r.totalRentals,
          }))}
        />
        <GarageTypeReportTable rows={byTypeRows} />
      </TabsContent>

      <TabsContent value="by-tenant" className="space-y-5">
        <ReportChartCard
          title="Top Tenants by Total Spend"
          subtitle="Cumulative rental and extension spend across tenants"
          data={byTenantRows.slice(0, 10).map((r) => ({
            label: r.fullName.split(' ')[0] ?? r.fullName,
            revenue: r.totalSpend,
            rentals: r.totalRentals,
          }))}
        />
        <TenantReportTable rows={byTenantRows} />
      </TabsContent>
    </Tabs>
  );
}
