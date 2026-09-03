import type { PaymentMode } from '@/lib/payments/mode'
import { isSupabaseConfigured } from '@/lib/supabase/configured'
import { createClient } from '@/lib/supabase/server'
import { getSiteSettings, type SiteSettings } from '@/lib/site-data'

export type ClubSettings = SiteSettings & {
  bankPaymentNote: string
  paymentProvider: PaymentMode
}

const seedFallback: ClubSettings = {
  ...getSiteSettings(),
  bankPaymentNote:
    'Pay by bank transfer or cash to the treasurer — your membership is confirmed as soon as the committee records it.',
  paymentProvider: 'simulated',
}

export async function getClubSettings(): Promise<ClubSettings> {
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
  }
}
