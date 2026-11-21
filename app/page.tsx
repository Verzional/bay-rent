import { getSessionUser } from '@/lib/session';
import { getPublicFacilitySummary } from '@/service/garage';
import { BayRateCards } from './_components/bay-rate-cards';
import { FacilityRulesStrip } from './_components/facility-rules-strip';
import { HeroSection } from './_components/hero-section';
import { PublicHeader } from './_components/public-header';

/**
 * Public facility overview displaying live bay availability and starting rates.
 */
export default async function HomePage() {
  const [user, summaries] = await Promise.all([
    getSessionUser(),
    getPublicFacilitySummary(),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicHeader user={user} />
      <main className="flex-1">
        <HeroSection user={user} />
        <BayRateCards summaries={summaries} />
        <FacilityRulesStrip />
      </main>
      <footer className="border-t border-stone-200 bg-stone-50 py-6 text-center text-xs text-stone-500">
        © 2026 Bay-Rent Vehicle Garage Facility · Secure Daily &amp; Monthly Bay Rentals
      </footer>
    </div>
  );
}
