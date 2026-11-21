import type { ReactNode } from 'react';
import { requireAdmin } from '@/lib/session';
import { countPendingVerifications } from '@/service/auth';
import { AdminSidebar } from './_components/admin-sidebar';

/**
 * Admin Operations Console layout with left sidebar and live pending verification count.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const [user, pendingVerifications] = await Promise.all([
    requireAdmin(),
    countPendingVerifications(),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-background lg:h-screen lg:flex-row lg:overflow-hidden">
      <AdminSidebar user={user} pendingVerifications={pendingVerifications} />
      <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8 lg:overflow-y-auto">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
