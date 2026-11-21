import { BayPlaque } from '@/app/_components/common/bay-plaque';
import { CurrencyText } from '@/app/_components/common/currency-text';
import { PaymentProofDialog } from '@/app/_components/common/payment-proof-dialog';
import { StatusBadge } from '@/app/_components/common/status-badge';
import { Card } from '@/app/_components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/_components/ui/table';
import { formatDate, RENTAL_TYPE_LABELS } from '@/utils/format';
import type { RentalDetail } from '@/types';

/**
 * Tabular rental history showing initial and extended costs, dates, and status.
 */
export function RentalHistoryTable({ rentals }: { rentals: RentalDetail[] }) {
  return (
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Bay</TableHead>
            <TableHead>Vehicle</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead>Period</TableHead>
            <TableHead>Total Paid</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Receipt</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rentals.map((rental) => (
            <TableRow key={rental.rentalId}>
              <TableCell>
                <BayPlaque code={rental.garageCode} type={rental.garageType} size="sm" />
              </TableCell>
              <TableCell>
                <div className="font-medium text-stone-900">{rental.brandModel}</div>
                {rental.licensePlate ? (
                  <div className="font-mono text-xs text-stone-500">
                    {rental.licensePlate}
                  </div>
                ) : null}
              </TableCell>
              <TableCell className="text-xs text-stone-700">
                {RENTAL_TYPE_LABELS[rental.rentalType]}
                {rental.daysCount ? ` (${rental.daysCount}d)` : ''}
              </TableCell>
              <TableCell className="text-xs text-stone-600 whitespace-nowrap">
                {formatDate(rental.startDate)} – {formatDate(rental.endDate)}
              </TableCell>
              <TableCell>
                <CurrencyText
                  amount={rental.grandTotalCost}
                  className="font-semibold text-stone-900"
                />
                {rental.extensions.length > 0 ? (
                  <div className="text-[11px] text-stone-500">
                    incl. {rental.extensions.length} ext.
                  </div>
                ) : null}
              </TableCell>
              <TableCell>
                <StatusBadge status={rental.status} />
              </TableCell>
              <TableCell className="text-right">
                <PaymentProofDialog
                  proofUrl={rental.extensions[0]?.paymentProofUrl ?? rental.paymentProofUrl}
                  title={`Bay ${rental.garageCode} Payment Proof`}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
