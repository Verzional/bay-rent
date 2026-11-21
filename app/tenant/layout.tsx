import type { ReactNode } from 'react';
import { requireTenant } from '@/lib/session';
import { TenantNavbar } from './_components/tenant-navbar';

/**
 * Tenant Portal layout wrapping `/tenant/*` views behind session verification.
 */
export default async function TenantLayout({ children }: { children: ReactNode }) {
  const user = await requireTenant();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <TenantNavbar user={user} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}
