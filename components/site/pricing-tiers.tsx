/**
 * P0-10 — structure from 21st.dev "Pricing Cards"
 * (https://21st.dev/@kokonutd/components/pricing-cards, MIT). Kept: responsive
 * tier grid + feature list with included states. Stripped per §3.6: gradients,
 * hover-lift, "most popular" ribbon, monthly/annual toggle, dark mode.
 * Every tier states the §2.5 fact that memberships run to 31 December.
 */

import Link from 'next/link'
import { Check } from 'lucide-react'

import { FullGrid } from '@/components/layout/grids'
import { Button } from '@/components/ui/button'
import { formatMoneyGBP } from '@/lib/format'

export type PricingTier = {
  name: string
  pricePence: number
  description: string
  features: string[]
  href: string
  cta: string
}

export function PricingTiers({
  tiers,
  yearNote = 'Annual membership',
}: {
  tiers: PricingTier[]
  yearNote?: string
}) {
  return (
    <FullGrid maxColumns={3}>
      {tiers.map((tier) => (
        <div
          key={tier.name}
          className="flex h-full flex-col rounded-xl border border-stone bg-card p-6"
        >
          <h3>{tier.name}</h3>
          <p className="mt-1 text-sm text-ink-muted">{tier.description}</p>
          <p className="mt-4">
            <span className="font-heading text-4xl font-semibold tabular-nums">
              {formatMoneyGBP(tier.pricePence)}
            </span>
            <span className="text-sm text-ink-muted"> / year</span>
          </p>
          <p className="text-micro text-ink-muted">{yearNote}</p>
          <ul className="mt-5 space-y-2.5">
            {tier.features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm">
                <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success" />
                {f}
              </li>
            ))}
          </ul>
          <div className="mt-auto pt-6">
            <Button asChild className="w-full">
              <Link href={tier.href}>{tier.cta}</Link>
            </Button>
          </div>
        </div>
      ))}
    </FullGrid>
  )
}
