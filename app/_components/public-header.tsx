import Link from 'next/link';
import type { SessionUser } from '@/types';
import { Button } from '@/app/_components/ui/button';
import { BrandMark } from './brand-mark';

interface PublicHeaderProps {
  user: SessionUser | null;
}

/**
 * Top navigation bar for the public facility overview page (`/`).
 */
export function PublicHeader({ user }: PublicHeaderProps) {
  const dashboardHref = user?.role === 'ADMIN' ? '/admin' : '/tenant';

  return (
    <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <BrandMark subtitle="Vehicle Garage Facility" />
        <div className="flex items-center gap-2.5">
          {user ? (
            <Button asChild size="sm">
              <Link href={dashboardHref}>
                {user.role === 'ADMIN' ? 'Admin Console' : 'Tenant Portal'}
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">Register</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
