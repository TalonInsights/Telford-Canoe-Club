import { NextResponse } from 'next/server'

import { isPaypalConfigured, verifyWebhookSignature } from '@/lib/payments/paypal'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Json } from '@/types/database'

export const runtime = 'nodejs'

/**
 * P4-03 — PayPal webhook: the reconciliation path (on-approve capture is the
 * fast path). DORMANT until D1: without PayPal credentials + webhook id +
 * service-role key it answers 503 and touches nothing. Idempotent on capture
 * id; replays are safe.
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

  const supabase = createAdminClient()
  const captureId = event.resource?.id ?? null
  const orderId = event.resource?.supplementary_data?.related_ids?.order_id ?? null

  const audit = (action: string, entityId: string | null, after: Json) =>
    supabase.rpc('audit', {
      p_action: action,
      p_entity: 'memberships',
      ...(entityId ? { p_entity_id: entityId } : {}),
      p_after: after,
    })

  switch (event.event_type) {
    case 'PAYMENT.CAPTURE.COMPLETED': {
      if (!captureId) return NextResponse.json({ error: 'no capture id' }, { status: 400 })

      // Already recorded (fast path won) → done.
      const { data: byCapture } = await supabase
        .from('memberships')
        .select('id, status')
        .eq('paypal_capture_id', captureId)
        .maybeSingle()
      if (byCapture) return NextResponse.json({ ok: true, deduped: true })

      // Browser closed mid-capture: find the pending row by order id.
      if (orderId) {
        const { data: byOrder } = await supabase
          .from('memberships')
          .select('id, status')
          .eq('paypal_order_id', orderId)
          .maybeSingle()
        if (byOrder && byOrder.status === 'pending') {
          await supabase
            .from('memberships')
            .update({ status: 'active', paid_at: new Date().toISOString(), paypal_capture_id: captureId })
            .eq('id', byOrder.id)
          await audit('membership.paid_online', byOrder.id, {
            status: 'active',
            capture_ref: captureId,
            gateway: 'paypal-webhook',
          })
          return NextResponse.json({ ok: true, activated: byOrder.id })
        }
      }
      await audit('payment.webhook_unmatched', null, {
        event: event.event_type,
        capture: captureId,
        order: orderId,
      })
      return NextResponse.json({ ok: true, unmatched: true })
    }

    case 'PAYMENT.CAPTURE.REFUNDED': {
      if (!captureId) return NextResponse.json({ error: 'no capture id' }, { status: 400 })
      const { data: m } = await supabase
        .from('memberships')
        .select('id, status')
        .eq('paypal_capture_id', captureId)
        .maybeSingle()
      if (m && m.status !== 'refunded') {
        await supabase.from('memberships').update({ status: 'refunded' }).eq('id', m.id)
        await audit('membership.refunded', m.id, { via: 'paypal-webhook', capture_ref: captureId })
      }
      return NextResponse.json({ ok: true })
    }

    case 'PAYMENT.CAPTURE.DENIED':
    case 'PAYMENT.CAPTURE.PENDING': {
      if (orderId) {
        const { data: m } = await supabase
          .from('memberships')
          .select('id')
          .eq('paypal_order_id', orderId)
          .maybeSingle()
        if (m) {
          await audit('payment.capture_' + (event.event_type.endsWith('DENIED') ? 'declined' : 'held'), m.id, {
            via: 'paypal-webhook',
            status: event.resource?.status,
          })
        }
      }
      return NextResponse.json({ ok: true })
    }

    default:
      return NextResponse.json({ ok: true, ignored: event.event_type })
  }
}
