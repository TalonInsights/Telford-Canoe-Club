import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'

import { ShopCheckoutClient } from './shop-checkout-client'
import { getSession } from '@/lib/auth/guards'
import { getClubSettings } from '@/lib/queries/settings'
import { getOrderByRef } from '@/lib/queries/merch'
import { isSupabaseConfigured } from '@/lib/supabase/configured'

export const metadata: Metadata = { title: 'Shop checkout', robots: { index: false } }

/**
 * The shop's gateway hop. The same five gates as the membership checkout, in
 * the same order, because each one is load bearing: a bad reference is a 404,
 * a signed-out visitor is sent to log in and back, an order that is already
 * paid bounces to the receipt (which is what makes the back button safe), and
 * real-PayPal mode never lands here at all.
 */
export default async function ShopCheckoutPage({
  params,
}: {
  params: Promise<{ orderRef: string }>
}) {
  const { orderRef } = await params
  if (!/^[A-Z0-9-]{8,64}$/i.test(orderRef)) notFound()
  if (!isSupabaseConfigured()) notFound()

  const session = await getSession()
  if (!session) redirect(`/login?next=/checkout/shop/${encodeURIComponent(orderRef)}`)

  const order = await getOrderByRef(orderRef)
  if (!order || order.user_id !== session.userId) notFound()
  if (order.status === 'paid' || order.status === 'fulfilled') {
    redirect('/members/shop/orders?paid=1')
  }
  if (order.status !== 'pending') redirect('/members/shop')

  const settings = await getClubSettings()
  if (settings.paymentProvider !== 'simulated') redirect('/members/shop')

  return (
    <ShopCheckoutClient
      orderRef={orderRef}
      amountPence={order.total_pence}
      payerName={`${session.profile.first_name ?? ''} ${session.profile.last_name ?? ''}`.trim()}
      lines={order.items.map((item) => ({
        id: item.id,
        label: `${item.quantity} × ${item.product_name}${item.size ? ` (size ${item.size})` : ''}`,
        amountPence: item.unit_price_pence * item.quantity,
      }))}
    />
  )
}
