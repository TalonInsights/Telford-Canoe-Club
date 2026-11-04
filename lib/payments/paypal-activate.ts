import 'server-only'

import { sendMembershipActivatedEmails } from '@/lib/email/membership'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Recording a verified PayPal capture, server-side. In `paypal` mode the
 * database functions (`complete_online_payment` / `complete_merch_payment`)
 * deliberately REFUSE a caller-initiated capture — real activation is only ever
 * written by the server after PayPal confirms, through the service-role key,
 * which bypasses RLS and the self-capture gate (0018 / 0023). Both the fast path
 * (the `/checkout/return` redirect) and the reconciliation path (the webhook)
 * funnel through here so activation is written in exactly one place.
 *
 * Every function is idempotent: a second call for the same order (the webhook
 * racing the return redirect, a refresh, a replayed webhook) confirms the
 * existing state and never double-activates or double-emails.
 */

export type ActivateResult =
  | { ok: true; kind: 'membership' | 'merch'; id: string; newlyActivated: boolean; redirect: string }
  | { ok: false; reason: string }

const tierLabel: Record<string, string> = { adult: 'Adult', junior: 'Junior', family: 'Family' }

/** Activate the membership whose PayPal order id is `orderId`, from a captured payment. */
export async function activateMembershipByOrder(opts: {
  orderId: string
  captureId: string
}): Promise<ActivateResult> {
  const supabase = createAdminClient()
  const redirect = '/members/membership?paid=1'

  const { data: m } = await supabase
    .from('memberships')
    .select(
      'id, status, paypal_capture_id, tier, amount_pence, primary_user_id, membership_periods(label), membership_types(name)'
    )
    .eq('paypal_order_id', opts.orderId)
    .maybeSingle()
  if (!m) return { ok: false, reason: 'order not found' }

  // Already recorded (the other path won, or a refresh): confirm, don't repeat.
  if (m.status === 'active') {
    return { ok: true, kind: 'membership', id: m.id, newlyActivated: false, redirect }
  }
  if (m.status !== 'pending') return { ok: false, reason: 'this order can no longer be paid' }

  // Conditional update: only the call that actually flips pending → active owns
  // the receipt, so a race cannot send two emails.
  const { data: updated, error } = await supabase
    .from('memberships')
    .update({
      status: 'active',
      paid_at: new Date().toISOString(),
      paypal_capture_id: opts.captureId,
    })
    .eq('id', m.id)
    .eq('status', 'pending')
    .select('id')
  if (error) return { ok: false, reason: error.message }
  const newlyActivated = (updated?.length ?? 0) > 0
  if (!newlyActivated) {
    return { ok: true, kind: 'membership', id: m.id, newlyActivated: false, redirect }
  }

  await supabase.rpc('audit', {
    p_action: 'membership.paid_online',
    p_entity: 'memberships',
    p_entity_id: m.id,
    p_after: { status: 'active', capture_ref: opts.captureId, gateway: 'paypal' },
  })

  // Receipt + committee heads-up, best effort (Resend-gated; never blocks activation).
  const { data: profile } = await supabase
    .from('profiles')
    .select('email, first_name, last_name')
    .eq('user_id', m.primary_user_id)
    .maybeSingle()
  const periodLabel = (m.membership_periods as unknown as { label: string } | null)?.label ?? ''
  const typeName = (m.membership_types as unknown as { name: string } | null)?.name
  await sendMembershipActivatedEmails({
    memberEmail: profile?.email ?? null,
    memberName: `${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim(),
    tierLabel: typeName ?? tierLabel[m.tier] ?? m.tier,
    periodLabel,
    amountPence: m.amount_pence,
    method: 'PayPal',
    paymentRef: opts.captureId,
  })

  return { ok: true, kind: 'membership', id: m.id, newlyActivated: true, redirect }
}

/** Mark the shop order whose PayPal order id is `orderId` paid, from a captured payment. */
export async function activateMerchByOrder(opts: {
  orderId: string
  captureId: string
}): Promise<ActivateResult> {
  const supabase = createAdminClient()
  const redirect = '/members/shop/orders?paid=1'

  const { data: o } = await supabase
    .from('merch_orders')
    .select('id, status, capture_ref, total_pence')
    .eq('order_ref', opts.orderId)
    .maybeSingle()
  if (!o) return { ok: false, reason: 'order not found' }

  if (o.status === 'paid' || o.status === 'fulfilled') {
    return { ok: true, kind: 'merch', id: o.id, newlyActivated: false, redirect }
  }
  if (o.status !== 'pending') return { ok: false, reason: 'this order can no longer be paid' }

  const { data: updated, error } = await supabase
    .from('merch_orders')
    .update({ status: 'paid', capture_ref: opts.captureId, paid_at: new Date().toISOString() })
    .eq('id', o.id)
    .eq('status', 'pending')
    .select('id')
  if (error) return { ok: false, reason: error.message }
  const newlyActivated = (updated?.length ?? 0) > 0
  if (newlyActivated) {
    await supabase.rpc('audit', {
      p_action: 'merch.paid_online',
      p_entity: 'merch_orders',
      p_entity_id: o.id,
      p_after: {
        status: 'paid',
        capture_ref: opts.captureId,
        total_pence: o.total_pence,
        gateway: 'paypal',
      },
    })
  }

  return { ok: true, kind: 'merch', id: o.id, newlyActivated, redirect }
}

/** Mark a membership/shop order refunded from a PayPal refund webhook. Idempotent. */
export async function refundByCapture(opts: {
  captureId: string
  kind: 'membership' | 'merch'
}): Promise<{ ok: boolean; id?: string }> {
  const supabase = createAdminClient()
  if (opts.kind === 'merch') {
    const { data: o } = await supabase
      .from('merch_orders')
      .select('id, status')
      .eq('capture_ref', opts.captureId)
      .maybeSingle()
    if (!o || o.status === 'refunded') return { ok: true, id: o?.id }
    await supabase.from('merch_orders').update({ status: 'refunded' }).eq('id', o.id)
    await supabase.rpc('audit', {
      p_action: 'merch.refunded',
      p_entity: 'merch_orders',
      p_entity_id: o.id,
      p_after: { via: 'paypal-webhook', capture_ref: opts.captureId },
    })
    return { ok: true, id: o.id }
  }
  const { data: m } = await supabase
    .from('memberships')
    .select('id, status')
    .eq('paypal_capture_id', opts.captureId)
    .maybeSingle()
  if (!m || m.status === 'refunded') return { ok: true, id: m?.id }
  await supabase.from('memberships').update({ status: 'refunded' }).eq('id', m.id)
  await supabase.rpc('audit', {
    p_action: 'membership.refunded',
    p_entity: 'memberships',
    p_entity_id: m.id,
    p_after: { via: 'paypal-webhook', capture_ref: opts.captureId },
  })
  return { ok: true, id: m.id }
}
