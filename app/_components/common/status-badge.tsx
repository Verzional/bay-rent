import type {
  GarageStatus,
  RentalStatus,
  VerificationStatus,
} from '@/types';
import { STATUS_LABELS } from '@/utils/format';
import { Badge, type BadgeProps } from '@/app/_components/ui/badge';

type AnyStatus = GarageStatus | RentalStatus | VerificationStatus;

const STATUS_VARIANT: Record<AnyStatus, BadgeProps['variant']> = {
  AVAILABLE: 'emerald',
  USED: 'rose',
  ACTIVE: 'emerald',
  COMPLETED: 'neutral',
  PENDING: 'amber',
  ACCEPTED: 'emerald',
  REJECTED: 'rose',
};

/**
 * Renders a color-coded status badge for garage bays, rentals, and verifications.
 */
export function StatusBadge({
  status,
  className,
}: {
  status: AnyStatus;
  className?: string;
}) {
  return (
    <Badge variant={STATUS_VARIANT[status]} className={className}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
