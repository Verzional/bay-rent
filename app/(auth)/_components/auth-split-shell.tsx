import type { ReactNode } from 'react';
import { ShieldCheck, Zap, Layers } from 'lucide-react';
import { BrandMark } from '@/app/_components/brand-mark';

interface AuthSplitShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

/**
 * Split architectural concrete shell for authentication pages (`/login`, `/register`).
 */
export function AuthSplitShell({ title, subtitle, children }: AuthSplitShellProps) {
  return (
    <div className="grid min-h-screen lg:grid-cols-12">
      <div className="relative hidden flex-col justify-between bg-stone-900 p-10 text-stone-100 lg:col-span-5 lg:flex">
        <div>
          <BrandMark inverted subtitle="Vehicle Bay Management" />
          <div className="mt-14 space-y-4">
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Precision storage for bicycles, cars, and electric vehicles.
            </h1>
            <p className="text-sm leading-relaxed text-stone-300">
              Automated compatibility matching, transparent daily and calendar-month
              billing, and dedicated EV full-charge metering.
            </p>
          </div>
        </div>

        <div className="space-y-4 border-t border-stone-800 pt-8 text-xs text-stone-300">
          <div className="flex items-start gap-3">
            <Layers className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <div>
              <p className="font-semibold text-white">Bay Codes S### / C### / E###</p>
              <p className="text-stone-400">
                Sequential bay plaques allocated automatically by vehicle class.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Zap className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
            <div>
              <p className="font-semibold text-white">Mandatory Full Charge on EV Bays</p>
              <p className="text-stone-400">
                Calculated automatically from vehicle battery kWh and bay kWh tariff.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
            <div>
              <p className="font-semibold text-white">KTP / NIK Verification</p>
              <p className="text-stone-400">
                Admin-verified tenant onboarding ensures trusted bay access.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-center bg-background px-4 py-10 sm:px-8 lg:col-span-7">
        <div className="mx-auto w-full max-w-md space-y-6">
          <div className="lg:hidden">
            <BrandMark subtitle="Vehicle Bay Management" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">{title}</h2>
            <p className="mt-1 text-sm text-stone-600">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
