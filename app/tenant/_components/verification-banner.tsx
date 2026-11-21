import { Clock, ShieldAlert } from 'lucide-react';
import { Alert } from '@/app/_components/ui/alert';
import type { VerificationStatus } from '@/types';

/**
 * Renders an informative banner when a tenant account is `PENDING` or `REJECTED`.
 */
export function VerificationBanner({ status }: { status: VerificationStatus }) {
  if (status === 'ACCEPTED') {
    return null;
  }

  if (status === 'PENDING') {
    return (
      <Alert variant="amber" className="p-5">
        <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
        <div className="space-y-1">
          <h3 className="font-semibold text-amber-950">
            Account Verification Pending
          </h3>
          <p className="text-sm text-amber-900">
            An administrator is reviewing your National ID (KTP / NIK) details. Once
            approved, you will be able to reserve garage bays from this portal.
          </p>
        </div>
      </Alert>
    );
  }

  return (
    <Alert variant="rose" className="p-5">
      <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-rose-700" />
      <div className="space-y-1">
        <h3 className="font-semibold text-rose-950">Account Verification Rejected</h3>
        <p className="text-sm text-rose-900">
          Your National ID (KTP / NIK) verification was rejected by an administrator.
          Please contact facility management to resolve your registration details.
        </p>
      </div>
    </Alert>
  );
}
