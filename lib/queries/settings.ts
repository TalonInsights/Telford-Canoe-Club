import { cache } from 'react'

import type { PaymentMode } from '@/lib/payments/mode'
import { isSupabaseConfigured } from '@/lib/supabase/configured'
import { createClient } from '@/lib/supabase/server'
import { getSiteSettings, type SiteSettings } from '@/lib/site-data'

export type ClubSettings = SiteSettings & {
  bankPaymentNote: string
  paymentProvider: PaymentMode
  shopOpen: boolean
  shopClosedNote: string | null
  webcamUrl: string | null
  webcamNote: string | null
  checkinsEnabled: boolean
}

const seedFallback: ClubSettings = {
  ...getSiteSettings(),
  bankPaymentNote:
    'Pay by bank transfer or cash to the treasurer, your membership is confirmed as soon as the committee records it.',
  paymentProvider: 'simulated',
  shopOpen: true,
  shopClosedNote: null,
  webcamUrl: 'https://www.farsondigitalwatercams.com/locations/atcham',
  webcamNote:
    'Atcham is about 10 miles upstream, so it shows what is coming rather than the level at the club.',
  checkinsEnabled: false,
}

/** Per-request cached: the home page alone reads this from three components. */
export const getClubSettings = cache(async (): Promise<ClubSettings> => {
  if (!isSupabaseConfigured()) return seedFallback
  const supabase = await createClient()
  const { data } = await supabase.from('club_settings').select('*').maybeSingle()
  if (!data) return seedFallback
  return {
    siteStatus: data.site_status as 'open' | 'closed',
    siteStatusNote: data.site_status_note,
    membershipYearLabel: data.membership_year_label,
    showUnconfirmed: data.show_unconfirmed,
    levelBands: null,
    tiers: [
      { name: 'Adult', pricePence: data.price_adult_pence },
      { name: 'Junior', pricePence: data.price_junior_pence },
      { name: 'Family', pricePence: data.price_family_pence },
    ],
    bankPaymentNote: data.bank_payment_note,
    paymentProvider: (data.payment_provider ?? 'off') as PaymentMode,
    shopOpen: data.shop_open ?? true,
    shopClosedNote: data.shop_closed_note,
    webcamUrl: data.webcam_url,
    webcamNote: data.webcam_note,
    checkinsEnabled: data.checkins_enabled ?? false,
  }
})
