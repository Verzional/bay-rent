'use client';

import {
  BarChart3,
  CalendarClock,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Warehouse,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logoutAction } from '@/service/auth';
import { Badge } from '@/app/_components/ui/badge';
import { Button } from '@/app/_components/ui/button';
import { cn } from '@/lib/utils';
import type { NavItem } from '@/types';
import type { SessionUser } from '@/types';
import { BrandMark } from '@/app/_components/brand-mark';

interface AdminSidebarProps {
  user: SessionUser;
  pendingVerifications: number;
}

const ICONS = {
  dashboard: LayoutDashboard,
  garages: Warehouse,
  verifications: ShieldCheck,
  rentals: CalendarClock,
  reports: BarChart3,
  rent: Warehouse,
};

/**
 * Left architectural sidebar navigation for the Admin Operations Console.
 */
export function AdminSidebar({ user, pendingVerifications }: AdminSidebarProps) {
  const pathname = usePathname();

  const items: NavItem[] = [
    { label: 'Overview', href: '/admin', iconName: 'dashboard' },
    { label: 'Garages', href: '/admin/garages', iconName: 'garages' },
    {
      label: 'Verifications',
      href: '/admin/verifications',
      iconName: 'verifications',
      badgeCount: pendingVerifications,
    },
    { label: 'Active Rentals', href: '/admin/rentals', iconName: 'rentals' },
    { label: 'Reports', href: '/admin/reports', iconName: 'reports' },
  ];

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

  return (
    <>
      {/* Desktop Left Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-stone-200 bg-white lg:flex">
        <div className="flex h-16 items-center border-b border-stone-200 px-5">
          <BrandMark href="/admin" subtitle="Admin Console" />
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {items.map((item) => {
            const Icon = ICONS[item.iconName];
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-stone-900 text-stone-50'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900',
                )}
              >
                <span className="flex items-center gap-2.5">
                  <Icon
                    className={cn('h-4 w-4', active ? 'text-amber-400' : 'text-stone-500')}
                  />
                  {item.label}
                </span>
                {item.badgeCount && item.badgeCount > 0 ? (
                  <Badge variant="amber" className="font-mono text-[11px]">
                    {item.badgeCount}
                  </Badge>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-stone-200 p-4 space-y-3">
          <div className="rounded-lg bg-stone-50 px-3 py-2 border border-stone-200">
            <p className="truncate text-xs font-semibold text-stone-900">{user.fullName}</p>
            <p className="truncate text-[11px] text-stone-500">{user.email}</p>
          </div>
          <form action={logoutAction}>
            <Button type="submit" variant="outline" size="sm" className="w-full justify-start">
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </Button>
          </form>
        </div>
      </aside>

      {/* Mobile / Tablet Top Bar */}
      <div className="border-b border-stone-200 bg-white lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <BrandMark href="/admin" subtitle="Admin" />
          <form action={logoutAction}>
            <Button type="submit" variant="outline" size="sm">
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </Button>
          </form>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-t border-stone-100 px-3 py-2">
          {items.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium',
                  active
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200',
                )}
              >
                {item.label}
                {item.badgeCount && item.badgeCount > 0 ? (
                  <span className="rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white">
                    {item.badgeCount}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
