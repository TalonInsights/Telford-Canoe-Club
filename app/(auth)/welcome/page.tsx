import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { getSession } from '@/lib/auth/guards'
import { getRenewalOffer } from '@/lib/queries/members'
import { getClubSettings } from '@/lib/queries/settings'
import { getMembershipTypes } from '@/lib/queries/membership-types'
import { isSupabaseConfigured } from '@/lib/supabase/configured'
import { WelcomeClient } from './welcome-client'

export const metadata: Metadata = {
  title: 'Choose your membership',
  description: 'Pick your Telford Canoe Club membership tier.',
}

export default async function WelcomePage({
  searchParams,
}: {
  searchParams: Promise<{ renew?: string }>
}) {
  if (isSupabaseConfigured()) {
    const session = await getSession()
    if (!session) redirect('/login?next=/welcome')
  }
  const { renew } = await searchParams
  const [settings, renewal, types] = await Promise.all([
    getClubSettings(),
    renew ? getRenewalOffer() : Promise.resolve(null),
    getMembershipTypes(),
  ])
  return (
    <WelcomeClient
      tiers={types.map((t) => ({
        id: t.id,
        name: t.name,
        pricePence: t.pricePence,
        description: t.description,
        durationMonths: t.durationMonths,
        coversFamily: t.coversFamily,
      }))}
      yearLabel={settings.membershipYearLabel}
      bankNote={settings.bankPaymentNote}
      paymentProvider={settings.paymentProvider}
      renewPeriod={renewal?.nextPeriod ?? null}
    />
  )
}
