import Link from 'next/link'

import { Section } from '@/components/layout/section'
import { Button } from '@/components/ui/button'

/**
 * DR-05 — the one closing band for every public page. Shape from 21st.dev
 * "Cta 10" (https://21st.dev/@shadcnblockscom/components/shadcnblocks-com-cta10,
 * MIT — left-aligned heading with two buttons), rebuilt on the §3.4 7/5 split
 * so title and actions balance at desktop and stack at mobile. Deep tone with
 * the arch motif; one signal button per band, the second action inverse.
 */

export type CtaAction = { label: string; href: string }

export function CtaBand({
  title,
  intro,
  kicker,
  primary,
  secondary,
  spacing = 'tight',
}: {
  title: string
  intro?: string
  kicker?: string
  primary: CtaAction
  secondary?: CtaAction
  spacing?: 'default' | 'tight'
}) {
  return (
    <Section tone="deep" decor="arch" spacing={spacing}>
      <div className="grid gap-6 lg:grid-cols-12 lg:items-center">
        <div className="max-w-[68ch] lg:col-span-7">
          {kicker && <p className="mb-2 text-sm font-medium text-stone">{kicker}</p>}
          <h2>{title}</h2>
          {intro && <p className="mt-2 text-stone">{intro}</p>}
        </div>
        <div className="flex flex-wrap gap-3 lg:col-span-5 lg:justify-end">
          <Button asChild variant="signal" size="lg">
            <Link href={primary.href}>{primary.label}</Link>
          </Button>
          {secondary && (
            <Button asChild variant="inverse" size="lg">
              <Link href={secondary.href}>{secondary.label}</Link>
            </Button>
          )}
        </div>
      </div>
    </Section>
  )
}
