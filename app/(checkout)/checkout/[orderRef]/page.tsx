import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import { getSession } from '@/lib/auth/guards'
import { getClubSettings } from '@/lib/queries/settings'
import { isSupabaseConfigured } from '@/lib/supabase/configured'
import { createClient } from '@/lib/supabase/server'
import { CheckoutClient } from './checkout-client'

export const metadata: Metadata = { title: 'Checkout', robots: { index: false } }

const tierLabel: Record<string, string> = { adult: 'Adult', junior: 'Junior', family: 'Family' }

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ orderRef: string }>
}) {
  const { orderRef } = await params
  if (!/^[A-Z0-9-]{8,64}$/i.test(orderRef)) notFound()

  if (!isSupabaseConfigured()) {
    return (
      <div className="rounded-xl border border-stone bg-card p-6">
        <h1 className="text-xl">Checkout isn&apos;t connected yet</h1>
        <p className="mt-2 text-sm text-ink-muted">
          The database connection isn&apos;t configured on this environment, so there&apos;s no
          order to show.
        </p>
        <Link href="/join" className="mt-4 inline-block text-sm underline underline-offset-2">
          Back to the join page
        </Link>
      </div>
    )
  }

  const session = await getSession()
  if (!session) redirect(`/login?next=/checkout/${encodeURIComponent(orderRef)}`)

  const supabase = await createClient()
  const { data: m } = await supabase
    .from('memberships')
    .select('id, tier, status, amount_pence, paypal_order_id, membership_periods(label)')
    .eq('paypal_order_id', orderRef)
    .maybeSingle()

  if (!m) notFound()
  if (m.status === 'active') redirect('/members/membership?paid=1')
  if (m.status !== 'pending') redirect('/members/membership')

  const settings = await getClubSettings()
  if (settings.paymentProvider !== 'simulated') {
    // Real-PayPal mode never lands here (PayPal hosts its own approval page).
    redirect('/members/membership')
  }

  const periodLabel = (m.membership_periods as unknown as { label: string } | null)?.label ?? ''

  return (
    <CheckoutClient
      orderRef={orderRef}
      tier={tierLabel[m.tier] ?? m.tier}
      periodLabel={periodLabel}
      amountPence={m.amount_pence}
      payerName={`${session.profile.first_name ?? ''} ${session.profile.last_name ?? ''}`.trim()}
      payerEmail={session.email}
    />
  )
}
