import { CalendarCheck2, CheckCircle2, Zap } from 'lucide-react';

/**
 * Summarizes the core rental and compatibility policies on the landing page.
 */
export function FacilityRulesStrip() {
  const rules = [
    {
      icon: CalendarCheck2,
      title: 'Daily & Calendar-Month Billing',
      body: 'Daily bookings span 1–30 days. Monthly rentals span one exact calendar month at 25× the daily rate.',
    },
    {
      icon: Zap,
      title: 'Transparent EV Charging',
      body: 'Electric vehicles parked in EV bays (E###) include a one-time full charge (battery kWh × bay kWh tariff).',
    },
    {
      icon: CheckCircle2,
      title: 'Multi-Bay Tenant Support',
      body: 'Verified tenants can hold multiple concurrent bay rentals for different vehicles at the same time.',
    },
  ];

  return (
    <section className="border-t border-stone-200 bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
        {rules.map((rule) => (
          <div key={rule.title} className="space-y-2">
            <div className="inline-flex rounded-lg border border-stone-200 bg-stone-50 p-2 text-amber-600">
              <rule.icon className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-semibold text-stone-900">{rule.title}</h3>
            <p className="text-sm leading-relaxed text-stone-600">{rule.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
