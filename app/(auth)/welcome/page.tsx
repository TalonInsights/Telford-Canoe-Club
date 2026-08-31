import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { getSession } from '@/lib/auth/guards'
import { getClubSettings } from '@/lib/queries/settings'
import { isSupabaseConfigured } from '@/lib/supabase/configured'
import { WelcomeClient } from './welcome-client'

export const metadata: Metadata = {
  title: 'Choose your membership',
  description: 'Pick your Telford Canoe Club membership tier.',
}

export default async function WelcomePage() {
  if (isSupabaseConfigured()) {
    const session = await getSession()
    if (!session) redirect('/login')
  }
  const settings = await getClubSettings()
  return (
    <WelcomeClient
      tiers={settings.tiers}
      yearLabel={settings.membershipYearLabel}
      bankNote={settings.bankPaymentNote}
    />
  )
}
