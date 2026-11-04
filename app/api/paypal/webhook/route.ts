import { NextResponse } from 'next/server'

import { isPaypalConfigured, verifyWebhookSignature } from '@/lib/payments/paypal'
import {
  activateMembershipByOrder,
  activateMerchByOrder,
  refundByCapture,
} from '@/lib/payments/paypal-activate'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

/**
 * P4-03 — PayPal webhook: the reconciliation path (the /checkout/return capture
 * is the fast path; both share the idempotent helpers in paypal-activate, so
 * whichever arrives first wins). DORMANT until D1: without PayPal credentials +
 * webhook id + service-role key it answers 503 and touches nothing.
 *
 * A membership and a shop order are told apart by the `custom_id` PayPal echoes
 * back: shop orders carry a `merch|…` prefix, memberships carry `user|tier|period`.
 */
export async function POST(request: Request) {
  if (!isPaypalConfigured() || !process.env.PAYPAL_WEBHOOK_ID) {
    return NextResponse.json({ skipped: 'paypal not configured (D1)' }, { status: 503 })
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ skipped: 'service key not configured' }, { status: 503 })
  }

  const rawBody = await request.text()
  const verified = await verifyWebhookSignature(request.headers, rawBody)
  if (!verified) {
    return NextResponse.json({ error: 'signature verification failed' }, { status: 400 })
  }

  let event: {
    event_type?: string
    resource?: {
      id?: string
      status?: string
      custom_id?: string
      supplementary_data?: { related_ids?: { order_id?: string } }
    }
  }
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 })
  }

  const captureId = event.resource?.id ?? null
  const orderId = event.resource?.supplementary_data?.related_ids?.order_id ?? null
  const isMerch = (event.resource?.custom_id ?? '').startsWith('merch|')

  switch (event.event_type) {
    case 'PAYMENT.CAPTURE.COMPLETED': {
      if (!captureId || !orderId) {
        return NextResponse.json({ error: 'missing capture or order id' }, { status: 400 })
      }
      const result = isMerch
        ? await activateMerchByOrder({ orderId, captureId })
        : await activateMembershipByOrder({ orderId, captureId })
      if (!result.ok) {
        await createAdminClient().rpc('audit', {
          p_action: 'payment.webhook_unmatched',
          p_entity: isMerch ? 'merch_orders' : 'memberships',
          p_after: { event: event.event_type, capture: captureId, order: orderId, reason: result.reason },
        })
        return NextResponse.json({ ok: true, unmatched: true })
      }
      return NextResponse.json({
        ok: true,
        kind: result.kind,
        id: result.id,
        deduped: !result.newlyActivated,
      })
    }

    case 'PAYMENT.CAPTURE.REFUNDED': {
      if (!captureId) return NextResponse.json({ error: 'no capture id' }, { status: 400 })
      await refundByCapture({ captureId, kind: isMerch ? 'merch' : 'membership' })
      return NextResponse.json({ ok: true })
    }

    case 'PAYMENT.CAPTURE.DENIED':
    case 'PAYMENT.CAPTURE.PENDING': {
      if (orderId) {
        const supabase = createAdminClient()
        const action = 'payment.capture_' + (event.event_type.endsWith('DENIED') ? 'declined' : 'held')
        const after = { via: 'paypal-webhook', status: event.resource?.status }
        if (isMerch) {
          const { data: row } = await supabase
            .from('merch_orders')
            .select('id')
            .eq('order_ref', orderId)
            .maybeSingle()
          if (row) {
            await supabase.rpc('audit', {
              p_action: action,
              p_entity: 'merch_orders',
              p_entity_id: row.id,
              p_after: after,
            })
          }
        } else {
          const { data: row } = await supabase
            .from('memberships')
            .select('id')
            .eq('paypal_order_id', orderId)
            .maybeSingle()
          if (row) {
            await supabase.rpc('audit', {
              p_action: action,
              p_entity: 'memberships',
              p_entity_id: row.id,
              p_after: after,
            })
          }
        }
      }
      return NextResponse.json({ ok: true })
    }

    default:
      return NextResponse.json({ ok: true, ignored: event.event_type })
  }
}
