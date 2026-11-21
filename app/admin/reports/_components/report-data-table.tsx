import { CurrencyText } from '@/app/_components/common/currency-text';
import { Card } from '@/app/_components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/_components/ui/table';
import { GARAGE_TYPE_LABELS } from '@/utils/format';
import type {
  DailyReportRow,
  GarageTypeReportRow,
  MonthlyReportRow,
  TenantReportRow,
} from '@/types';

export function MonthlyReportTable({ rows }: { rows: MonthlyReportRow[] }) {
  return (
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Month</TableHead>
            <TableHead>New Rentals</TableHead>
            <TableHead>Extensions</TableHead>
            <TableHead>Initial Revenue</TableHead>
            <TableHead>Extension Revenue</TableHead>
            <TableHead className="text-right">Total Revenue</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.month}>
              <TableCell className="font-medium">{row.monthLabel}</TableCell>
              <TableCell className="font-mono">{row.rentalCount}</TableCell>
              <TableCell className="font-mono">{row.extensionCount}</TableCell>
              <TableCell>
                <CurrencyText amount={row.initialRevenue} />
              </TableCell>
              <TableCell>
                <CurrencyText amount={row.extensionRevenue} />
              </TableCell>
              <TableCell className="text-right font-semibold">
                <CurrencyText amount={row.totalRevenue} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

export function DailyReportTable({ rows }: { rows: DailyReportRow[] }) {
  return (
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>New Rentals</TableHead>
            <TableHead>Extensions</TableHead>
            <TableHead>Initial Revenue</TableHead>
            <TableHead>Extension Revenue</TableHead>
            <TableHead className="text-right">Total Revenue</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.day}>
              <TableCell className="font-mono text-xs">{row.dateLabel}</TableCell>
              <TableCell className="font-mono">{row.rentalCount}</TableCell>
              <TableCell className="font-mono">{row.extensionCount}</TableCell>
              <TableCell>
                <CurrencyText amount={row.initialRevenue} />
              </TableCell>
              <TableCell>
                <CurrencyText amount={row.extensionRevenue} />
              </TableCell>
              <TableCell className="text-right font-semibold">
                <CurrencyText amount={row.totalRevenue} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

export function GarageTypeReportTable({ rows }: { rows: GarageTypeReportRow[] }) {
  return (
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Garage Type</TableHead>
            <TableHead>Total Rentals</TableHead>
            <TableHead>Active</TableHead>
            <TableHead>Completed</TableHead>
            <TableHead>Extensions</TableHead>
            <TableHead className="text-right">Total Revenue</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.garageType}>
              <TableCell className="font-medium">
                {GARAGE_TYPE_LABELS[row.garageType]}
              </TableCell>
              <TableCell className="font-mono">{row.totalRentals}</TableCell>
              <TableCell className="font-mono">{row.activeRentals}</TableCell>
              <TableCell className="font-mono">{row.completedRentals}</TableCell>
              <TableCell className="font-mono">{row.extensionCount}</TableCell>
              <TableCell className="text-right font-semibold">
                <CurrencyText amount={row.totalRevenue} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

export function TenantReportTable({ rows }: { rows: TenantReportRow[] }) {
  return (
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tenant</TableHead>
            <TableHead>NIK</TableHead>
            <TableHead>Total Rentals</TableHead>
            <TableHead>Active</TableHead>
            <TableHead>Extensions</TableHead>
            <TableHead className="text-right">Total Spend</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-8 text-center text-sm text-stone-500">
                No tenant rental activity recorded yet.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.tenantId}>
                <TableCell>
                  <div className="font-medium text-stone-900">{row.fullName}</div>
                  <div className="text-xs text-stone-500">{row.email}</div>
                </TableCell>
                <TableCell className="font-mono text-xs">{row.nationalId}</TableCell>
                <TableCell className="font-mono">{row.totalRentals}</TableCell>
                <TableCell className="font-mono">{row.activeRentals}</TableCell>
                <TableCell className="font-mono">{row.extensionCount}</TableCell>
                <TableCell className="text-right font-semibold">
                  <CurrencyText amount={row.totalSpend} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
