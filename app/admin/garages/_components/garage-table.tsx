'use client';

import { ChevronLeft, ChevronRight, Search, Warehouse } from 'lucide-react';
import { BayPlaque } from '@/app/_components/common/bay-plaque';
import { CurrencyText } from '@/app/_components/common/currency-text';
import { EmptyState } from '@/app/_components/common/empty-state';
import { StatusBadge } from '@/app/_components/common/status-badge';
import { Button } from '@/app/_components/ui/button';
import { Card } from '@/app/_components/ui/card';
import { Input } from '@/app/_components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/_components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/_components/ui/table';
import { useGarageFilter } from '@/hooks';
import { GARAGE_TYPE_SHORT_LABELS } from '@/utils/format';
import { MONTHLY_RATE_MULTIPLIER } from '@/service/pricing';
import type { GarageItem, GarageStatus, GarageType } from '@/types';

/**
 * Searchable, filterable, and paginated inventory table of all facility garage bays.
 */
export function GarageTable({ garages }: { garages: GarageItem[] }) {
  const {
    searchQuery,
    typeFilter,
    statusFilter,
    page,
    totalPages,
    totalFiltered,
    paginated,
    setPage,
    setSearchQuery,
    setTypeFilter,
    setStatusFilter,
  } = useGarageFilter(garages, 20);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search bay code (e.g. C010)..."
            className="pl-9 font-mono"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="w-40">
            <Select
              value={typeFilter}
              onValueChange={(val) => setTypeFilter(val as 'ALL' | GarageType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Bay Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="BIKE">Bike (S###)</SelectItem>
                <SelectItem value="CAR">Car (C###)</SelectItem>
                <SelectItem value="EV">EV (E###)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-36">
            <Select
              value={statusFilter}
              onValueChange={(val) => setStatusFilter(val as 'ALL' | GarageStatus)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="AVAILABLE">Available</SelectItem>
                <SelectItem value="USED">Used</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {paginated.length === 0 ? (
        <EmptyState
          icon={<Warehouse className="h-5 w-5" />}
          title="No Garage Bays Found"
          description="Create bays in batches or adjust your type/status filters."
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bay Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Daily Rate</TableHead>
                <TableHead>Monthly (25×)</TableHead>
                <TableHead>EV kWh Rate</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((garage) => (
                <TableRow key={garage.garageCode}>
                  <TableCell>
                    <BayPlaque code={garage.garageCode} type={garage.type} size="sm" />
                  </TableCell>
                  <TableCell className="text-xs font-medium text-stone-700">
                    {GARAGE_TYPE_SHORT_LABELS[garage.type]}
                  </TableCell>
                  <TableCell>
                    <CurrencyText amount={garage.dailyRate} />
                  </TableCell>
                  <TableCell>
                    <CurrencyText amount={garage.dailyRate * MONTHLY_RATE_MULTIPLIER} />
                  </TableCell>
                  <TableCell>
                    {garage.kwhRate !== null ? (
                      <span className="font-mono text-xs font-medium text-cyan-800">
                        <CurrencyText amount={garage.kwhRate} /> / kWh
                      </span>
                    ) : (
                      <span className="text-xs text-stone-400">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={garage.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between border-t border-stone-200 bg-stone-50 px-4 py-3 text-xs text-stone-600">
            <span>
              Showing {paginated.length} of {totalFiltered} matching bays
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Prev
              </Button>
              <span className="font-mono">
                {page} / {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
