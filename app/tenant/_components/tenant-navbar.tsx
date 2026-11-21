'use client';

import { LogOut, PlusCircle, LayoutGrid } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logoutAction } from '@/service/auth';
import { StatusBadge } from '@/app/_components/common/status-badge';
import { Button } from '@/app/_components/ui/button';
import { cn } from '@/lib/utils';
import type { SessionUser } from '@/types';
import { BrandMark } from '@/app/_components/brand-mark';

interface TenantNavbarProps {
  user: SessionUser;
}

/**
 * Clean top navigation bar for the Tenant Portal (`/tenant` and `/tenant/rent`).
 */
export function TenantNavbar({ user }: TenantNavbarProps) {
  const pathname = usePathname();
  const isAccepted = user.verificationStatus === 'ACCEPTED';

  return (
    <header className="sticky top-0 z-30 border-b border-stone-200 bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <BrandMark href="/tenant" subtitle="Tenant Portal" />
          <nav className="hidden items-center gap-1 sm:flex">
            <Link
              href="/tenant"
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                pathname === '/tenant'
                  ? 'bg-stone-100 text-stone-900'
                  : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900',
              )}
            >
              <LayoutGrid className="h-4 w-4" />
              My Bays
            </Link>
            {isAccepted ? (
              <Link
                href="/tenant/rent"
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                  pathname === '/tenant/rent'
                    ? 'bg-amber-50 text-amber-900'
                    : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900',
                )}
              >
                <PlusCircle className="h-4 w-4" />
                Rent a Bay
              </Link>
            ) : null}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 md:flex">
            <span className="text-sm font-medium text-stone-800">{user.fullName}</span>
            <StatusBadge status={user.verificationStatus} />
          </div>
          {isAccepted ? (
            <Button asChild size="sm" className="sm:hidden">
              <Link href="/tenant/rent">Rent</Link>
            </Button>
          ) : null}
          <form action={logoutAction}>
            <Button type="submit" variant="outline" size="sm">
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
