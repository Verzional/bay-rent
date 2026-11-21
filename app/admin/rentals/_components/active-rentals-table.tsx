'use client';

import { CalendarClock } from 'lucide-react';
import { BayPlaque } from '@/app/_components/common/bay-plaque';
import { CurrencyText } from '@/app/_components/common/currency-text';
import { EmptyState } from '@/app/_components/common/empty-state';
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
import { CompleteRentalButton } from './complete-rental-button';
import { ExtendRentalDialog } from './extend-rental-dialog';

/**
 * Admin table displaying all garage bays currently rented today, with actions
 * to inspect payment proof, extend end dates, or manually complete rentals.
 */
export function ActiveRentalsTable({ rentals }: { rentals: RentalDetail[] }) {
  if (rentals.length === 0) {
    return (
      <EmptyState
        icon={<CalendarClock className="h-5 w-5" />}
        title="No Active Rentals"
        description="No garage bays are currently occupied today."
      />
    );
  }

  return (
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Bay</TableHead>
            <TableHead>Tenant</TableHead>
            <TableHead>Vehicle</TableHead>
            <TableHead>Schedule</TableHead>
            <TableHead>Total Billed</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rentals.map((rental) => (
            <TableRow key={rental.rentalId}>
              <TableCell>
                <BayPlaque code={rental.garageCode} type={rental.garageType} size="sm" />
              </TableCell>
              <TableCell>
                <div className="font-medium text-stone-900">{rental.tenantName}</div>
                <div className="text-xs text-stone-500">{rental.tenantPhone}</div>
              </TableCell>
              <TableCell>
                <div className="text-sm font-medium text-stone-900">
                  {rental.brandModel}
                </div>
                <div className="font-mono text-xs text-stone-500">
                  {rental.licensePlate ?? rental.vehicleType}
                </div>
              </TableCell>
              <TableCell className="text-xs text-stone-600 whitespace-nowrap">
                <div>
                  {formatDate(rental.startDate)} →{' '}
                  <strong className="text-stone-900">{formatDate(rental.endDate)}</strong>
                </div>
                <div className="text-stone-400">
                  {RENTAL_TYPE_LABELS[rental.rentalType]}
                  {rental.extensions.length > 0
                    ? ` · ${rental.extensions.length} ext.`
                    : ''}
                </div>
              </TableCell>
              <TableCell>
                <CurrencyText
                  amount={rental.grandTotalCost}
                  className="font-semibold text-stone-900"
                />
              </TableCell>
              <TableCell>
                <StatusBadge status={rental.status} />
              </TableCell>
              <TableCell className="text-right">
                <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                  <PaymentProofDialog
                    proofUrl={rental.extensions[0]?.paymentProofUrl ?? rental.paymentProofUrl}
                    title={`Bay ${rental.garageCode} — ${rental.extensions.length > 0 ? 'Latest Extension Proof' : 'Initial Proof'}`}
                    triggerLabel="Proof"
                  />
                  <ExtendRentalDialog rental={rental} />
                  <CompleteRentalButton
                    rentalId={rental.rentalId}
                    garageCode={rental.garageCode}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
