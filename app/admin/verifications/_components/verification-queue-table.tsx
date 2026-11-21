'use client';

import { Check, ShieldCheck, X } from 'lucide-react';
import { useState, useTransition } from 'react';
import { verifyTenantAction } from '@/service/auth';
import { EmptyState } from '@/app/_components/common/empty-state';
import { StatusBadge } from '@/app/_components/common/status-badge';
import { Alert } from '@/app/_components/ui/alert';
import { Button } from '@/app/_components/ui/button';
import { Card } from '@/app/_components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/_components/ui/table';
import { formatDateTime } from '@/utils/format';
import { cn } from '@/lib/utils';
import type { TenantProfile, VerificationStatus } from '@/types';

/**
 * Admin KTP / NIK verification queue allowing approval or rejection of new tenants.
 */
export function VerificationQueueTable({ tenants }: { tenants: TenantProfile[] }) {
  const [filter, setFilter] = useState<'ALL' | VerificationStatus>('PENDING');
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = tenants.filter((t) =>
    filter === 'ALL' ? true : t.verificationStatus === filter,
  );

  const handleDecision = (tenantId: number, decision: 'ACCEPTED' | 'REJECTED') => {
    setActiveId(tenantId);
    setFeedback(null);
    startTransition(async () => {
      const res = await verifyTenantAction(tenantId, decision);
      setFeedback({
        ok: res.success,
        text: res.message ?? 'Updated tenant status.',
      });
      setActiveId(null);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {(['PENDING', 'ACCEPTED', 'REJECTED', 'ALL'] as const).map((status) => {
          const count =
            status === 'ALL'
              ? tenants.length
              : tenants.filter((t) => t.verificationStatus === status).length;
          return (
            <button
              key={status}
              type="button"
              onClick={() => setFilter(status)}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer',
                filter === status
                  ? 'border-stone-900 bg-stone-900 text-white'
                  : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50',
              )}
            >
              <span>{status === 'ALL' ? 'All Tenants' : status}</span>
              <span className="font-mono opacity-80">({count})</span>
            </button>
          );
        })}
      </div>

      {feedback ? (
        <Alert variant={feedback.ok ? 'emerald' : 'rose'}>{feedback.text}</Alert>
      ) : null}

      {filtered.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck className="h-5 w-5" />}
          title="No Matching Tenant Registrations"
          description="All tenant accounts in this filter category have been processed."
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>National ID (NIK)</TableHead>
                <TableHead>Full Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Decision</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((tenant) => {
                const rowBusy = isPending && activeId === tenant.userId;
                return (
                  <TableRow key={tenant.userId}>
                    <TableCell className="font-mono text-xs font-semibold text-stone-900">
                      {tenant.nationalId}
                    </TableCell>
                    <TableCell className="font-medium text-stone-900">
                      {tenant.fullName}
                    </TableCell>
                    <TableCell className="text-xs text-stone-600">
                      <div>{tenant.email}</div>
                      <div className="font-mono text-stone-500">{tenant.phoneNumber}</div>
                    </TableCell>
                    <TableCell className="text-xs text-stone-500 whitespace-nowrap">
                      {formatDateTime(tenant.createdAt)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={tenant.verificationStatus} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {tenant.verificationStatus !== 'ACCEPTED' ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="emerald"
                            disabled={rowBusy}
                            onClick={() => handleDecision(tenant.userId, 'ACCEPTED')}
                          >
                            <Check className="h-3.5 w-3.5" />
                            Accept
                          </Button>
                        ) : null}
                        {tenant.verificationStatus !== 'REJECTED' ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            disabled={rowBusy}
                            onClick={() => handleDecision(tenant.userId, 'REJECTED')}
                          >
                            <X className="h-3.5 w-3.5" />
                            Reject
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
