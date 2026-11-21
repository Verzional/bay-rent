import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/app/_components/ui/button';
import type { SessionUser } from '@/types';

/**
 * Architectural hero banner for the public `/` landing page.
 */
export function HeroSection({ user }: { user: SessionUser | null }) {
  const portalHref = user ? (user.role === 'ADMIN' ? '/admin' : '/tenant') : '/register';

  return (
    <section className="border-b border-stone-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="max-w-3xl space-y-5">
          <h1 className="text-3xl font-bold tracking-tight text-stone-900 sm:text-5xl">
            Dedicated garage bays built for bicycles, cars, and EVs.
          </h1>
          <p className="text-base leading-relaxed text-stone-600 sm:text-lg">
            Reserve numbered bays (<span className="font-mono font-semibold">S###</span>,{' '}
            <span className="font-mono font-semibold">C###</span>,{' '}
            <span className="font-mono font-semibold">E###</span>) with automatic vehicle
            compatibility matching, 25× monthly discounts, and integrated EV kWh charging.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button asChild size="lg">
              <Link href={portalHref}>
                {user ? 'Open Dashboard' : 'Register as Tenant'}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            {!user ? (
              <Button asChild variant="outline" size="lg">
                <Link href="/login">Sign In to Existing Account</Link>
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
