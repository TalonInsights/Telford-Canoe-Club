import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { getSession } from '@/lib/auth/guards'
import { getRenewalOffer } from '@/lib/queries/members'
import { getClubSettings } from '@/lib/queries/settings'
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
  const [settings, renewal] = await Promise.all([
    getClubSettings(),
    renew ? getRenewalOffer() : Promise.resolve(null),
  ])
  return (
    <WelcomeClient
      tiers={settings.tiers}
      yearLabel={settings.membershipYearLabel}
      bankNote={settings.bankPaymentNote}
      paymentProvider={settings.paymentProvider}
      renewPeriod={renewal?.nextPeriod ?? null}
    />
  )
}
