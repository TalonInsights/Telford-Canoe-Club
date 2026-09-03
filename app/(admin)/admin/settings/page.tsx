import type { Metadata } from 'next'

import { SettingsForm } from '@/components/admin/settings-form'
import { requireRole } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Club settings' }

export default async function AdminSettingsPage() {
  await requireRole('admin')
  const supabase = await createClient()
  const { data } = await supabase.from('club_settings').select('*').maybeSingle()

  if (!data) {
    return (
      <div className="rounded-xl border border-stone bg-card p-6">
        <h1 className="text-2xl">Club settings</h1>
        <p className="mt-2 text-sm text-ink-muted">
          The settings row isn&apos;t reachable — check the database connection.
        </p>
      </div>
    )
  }

  return (
    <>
      <h1 className="text-2xl">Club settings</h1>
      <p className="mt-1 max-w-[68ch] text-sm text-ink-muted">
        Prices, the membership-year label, the payment switch and the site banner — every save
        is written to the audit log.
      </p>
      <div className="mt-6">
        <SettingsForm
          initial={{
            siteStatus: data.site_status as 'open' | 'closed',
            siteStatusNote: data.site_status_note ?? '',
            membershipYearLabel: data.membership_year_label,
            priceAdultPence: data.price_adult_pence,
            priceJuniorPence: data.price_junior_pence,
            priceFamilyPence: data.price_family_pence,
            bankPaymentNote: data.bank_payment_note,
            showUnconfirmed: data.show_unconfirmed,
            paymentProvider: (data.payment_provider ?? 'off') as 'off' | 'simulated' | 'paypal',
          }}
        />
      </div>
    </>
  )
}
