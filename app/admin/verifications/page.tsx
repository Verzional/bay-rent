import { PageHeader } from '@/app/_components/common/page-header';
import { requireAdmin } from '@/lib/session';
import { listTenantsForVerification } from '@/service/auth';
import { VerificationQueueTable } from './_components/verification-queue-table';

/**
 * Admin KTP / NIK tenant verification queue page.
 */
export default async function AdminVerificationsPage() {
  await requireAdmin();
  const tenants = await listTenantsForVerification();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Compliance"
        title="Tenant Verifications"
        description="Validate applicant National ID (KTP / NIK) details to grant or reject bay rental access."
      />

      <VerificationQueueTable tenants={tenants} />
    </div>
  );
}
