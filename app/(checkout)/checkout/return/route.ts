import { NextResponse } from 'next/server'

import { getPaymentProvider } from '@/lib/payments/provider'
import { activateMembershipByOrder, activateMerchByOrder } from '@/lib/payments/paypal-activate'
import { getClubSettings } from '@/lib/queries/settings'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

/**
 * P4-02 (real PayPal) — where PayPal sends the payer back after they approve.
 * PayPal appends `?token={orderId}` (the order id we created). This is the fast
 * path: capture the order, record it via the service-role helper, and bounce the
 * member to their receipt. The webhook is the backstop if the browser never
 * makes it back; both go through the same idempotent activation, so whichever
 * arrives first wins and the other confirms.
 *
 * Only live in `paypal` mode — the simulated gateway hosts its own page at
 * /checkout/[ref] and never redirects here.
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const orderId = url.searchParams.get('token')
  const home = (path: string) => NextResponse.redirect(new URL(path, request.url))

  if (!orderId || !/^[A-Z0-9-]{8,64}$/i.test(orderId)) return home('/members/membership')

  const settings = await getClubSettings()
  if (settings.paymentProvider !== 'paypal') return home('/members/membership')
  const provider = getPaymentProvider('paypal')
  if (!provider) return home('/members/membership')

  // Which order space is this? Membership first, then the shop.
  const admin = createAdminClient()
  const { data: membership } = await admin
    .from('memberships')
    .select('id, status')
    .eq('paypal_order_id', orderId)
    .maybeSingle()
  const isMembership = Boolean(membership)
  const { data: merch } = isMembership
    ? { data: null }
    : await admin.from('merch_orders').select('id, status').eq('order_ref', orderId).maybeSingle()
  if (!isMembership && !merch) return home('/members/membership')

  const okRedirect = isMembership ? '/members/membership?paid=1' : '/members/shop/orders?paid=1'
  const failRedirect = isMembership
    ? '/members/membership?payment=failed'
    : '/members/shop?payment=failed'

  // Already recorded (the webhook beat the redirect back)? Straight to the receipt.
  if (membership?.status === 'active') return home(okRedirect)
  if (merch && (merch.status === 'paid' || merch.status === 'fulfilled')) return home(okRedirect)

  // Capture the approved order. A 422 (already captured elsewhere) comes back as
  // a non-completed status, not a throw.
  let captureId: string | null = null
  try {
    const result = await provider.captureOrder(orderId)
    if (result.status === 'completed') captureId = result.captureRef
  } catch {
    // network/timeout — fall through to the already-captured recovery below
  }

  if (!captureId) {
    // The webhook may have captured in the meantime; re-read before giving up.
    if (isMembership) {
      const { data: m } = await admin
        .from('memberships')
        .select('status')
        .eq('paypal_order_id', orderId)
        .maybeSingle()
      if (m?.status === 'active') return home(okRedirect)
    } else {
      const { data: o } = await admin
        .from('merch_orders')
        .select('status')
        .eq('order_ref', orderId)
        .maybeSingle()
      if (o?.status === 'paid' || o?.status === 'fulfilled') return home(okRedirect)
    }
    return home(failRedirect)
  }

  const activated = isMembership
    ? await activateMembershipByOrder({ orderId, captureId })
    : await activateMerchByOrder({ orderId, captureId })
  return home(activated.ok ? activated.redirect : failRedirect)
}
