'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { getSession } from '@/lib/auth/guards'
import { sendMembershipActivatedEmails } from '@/lib/email/membership'
import { isOnlinePaymentOn } from '@/lib/payments/mode'
import { getPaymentProvider } from '@/lib/payments/provider'
import { getClubSettings } from '@/lib/queries/settings'
import { isSupabaseConfigured, NOT_CONFIGURED_MESSAGE } from '@/lib/supabase/configured'
import { createClient } from '@/lib/supabase/server'

export type CheckoutResult =
  | { ok: true; redirect: string }
  | { ok: false; message: string; declined?: boolean }

const tierLabel: Record<string, string> = { adult: 'Adult', junior: 'Junior', family: 'Family' }

const startSchema = z.object({
  tier: z.enum(['adult', 'junior', 'family']),
  familyNames: z.array(z.string().trim().max(120)).max(12).default([]),
  periodId: z.uuid().optional(),
})

/**
 * P4-02 — "Pay online now": creates/updates the pending membership row
 * (request_membership), asks the provider for an order, stamps it on the row
 * (begin_online_payment) and hands back the gateway approval URL.
 */
export async function startOnlineCheckoutAction(input: {
  tier: 'adult' | 'junior' | 'family'
  familyNames?: string[]
  periodId?: string
}): Promise<CheckoutResult> {
  if (!isSupabaseConfigured()) return { ok: false, message: NOT_CONFIGURED_MESSAGE }
  const session = await getSession()
  if (!session) return { ok: false, message: 'Log in first, then choose your membership.' }
  const parsed = startSchema.safeParse({
    tier: input.tier,
    familyNames: input.familyNames ?? [],
    periodId: input.periodId,
  })
  if (!parsed.success) return { ok: false, message: 'Choose a valid membership tier' }

  const settings = await getClubSettings()
  if (!isOnlinePaymentOn(settings.paymentProvider)) {
    return { ok: false, message: 'Online payment is switched off — pay the treasurer directly.' }
  }

  const supabase = await createClient()
  const { data: membershipId, error } = await supabase.rpc('request_membership', {
    p_tier: parsed.data.tier,
    p_family_names: parsed.data.familyNames,
    ...(parsed.data.periodId ? { p_period_id: parsed.data.periodId } : {}),
  })
  if (error || !membershipId) return { ok: false, message: error?.message ?? 'Could not start checkout' }

  return beginCheckoutFor(membershipId)
}

/** "Pay online instead" on an existing pending membership. */
export async function payPendingOnlineAction(membershipId: string): Promise<CheckoutResult> {
  if (!isSupabaseConfigured()) return { ok: false, message: NOT_CONFIGURED_MESSAGE }
  const session = await getSession()
  if (!session) return { ok: false, message: 'Log in first.' }
  if (!z.uuid().safeParse(membershipId).success) return { ok: false, message: 'Invalid membership' }
  const settings = await getClubSettings()
  if (!isOnlinePaymentOn(settings.paymentProvider)) {
    return { ok: false, message: 'Online payment is switched off — pay the treasurer directly.' }
  }
  return beginCheckoutFor(membershipId)
}

async function beginCheckoutFor(membershipId: string): Promise<CheckoutResult> {
  const supabase = await createClient()
  const settings = await getClubSettings()
  const provider = getPaymentProvider(settings.paymentProvider)
  if (!provider) return { ok: false, message: 'Online payment is switched off.' }

  const { data: m } = await supabase
    .from('memberships')
    .select('id, tier, status, amount_pence, primary_user_id, period_id, membership_periods(label)')
    .eq('id', membershipId)
    .maybeSingle()
  if (!m) return { ok: false, message: 'Membership not found' }
  if (m.status !== 'pending') return { ok: false, message: 'Only a pending membership can be paid online' }

  const periodLabel =
    (m.membership_periods as unknown as { label: string } | null)?.label ?? 'membership'

  let order
  try {
    order = await provider.createOrder({
      membershipId: m.id,
      tier: m.tier as 'adult' | 'junior' | 'family',
      periodId: m.period_id,
      periodLabel,
      userId: m.primary_user_id,
      amountPence: m.amount_pence,
    })
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'The payment provider is unavailable' }
  }

  const { error: beginError } = await supabase.rpc('begin_online_payment', {
    p_membership_id: m.id,
    p_order_ref: order.orderRef,
  })
  if (beginError) return { ok: false, message: beginError.message }

  revalidatePath('/members/membership')
  return { ok: true, redirect: order.approveUrl }
}

/**
 * P4-02/03 — capture. On the simulated gateway the Approve button lands here;
 * a decline exercises the DENIED branch (audited, membership stays pending).
 * With real PayPal the provider verifies before the database will activate.
 */
export async function captureOnlineOrderAction(
  orderRef: string,
  outcome: 'approve' | 'decline'
): Promise<CheckoutResult> {
  if (!isSupabaseConfigured()) return { ok: false, message: NOT_CONFIGURED_MESSAGE }
  const session = await getSession()
  if (!session) return { ok: false, message: 'Log in first.' }
  if (!/^[A-Z0-9-]{8,64}$/i.test(orderRef)) return { ok: false, message: 'Invalid order' }

  const settings = await getClubSettings()
  const provider = getPaymentProvider(settings.paymentProvider)
  if (!provider) return { ok: false, message: 'Online payment is switched off.' }

  const supabase = await createClient()
  let capture
  try {
    capture = await provider.captureOrder(orderRef, {
      simulateOutcome: outcome === 'decline' ? 'declined' : 'completed',
    })
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Capture failed' }
  }

  if (capture.status === 'declined') {
    const { data: m } = await supabase
      .from('memberships')
      .select('id')
      .eq('paypal_order_id', orderRef)
      .maybeSingle()
    if (m) {
      await supabase.rpc('audit', {
        p_action: 'payment.capture_declined',
        p_entity: 'memberships',
        p_entity_id: m.id,
        p_after: { order_ref: orderRef, reason: capture.reason },
      })
    }
    return { ok: false, declined: true, message: capture.reason }
  }

  const { data: membershipId, error } = await supabase.rpc('complete_online_payment', {
    p_order_ref: orderRef,
    p_capture_ref: capture.captureRef,
  })
  if (error || !membershipId) {
    return { ok: false, message: error?.message ?? 'Payment could not be recorded' }
  }

  // Receipt + committee heads-up (skipped silently until the Resend key exists)
  const { data: m } = await supabase
    .from('memberships')
    .select('tier, amount_pence, paypal_capture_id, membership_periods(label)')
    .eq('id', membershipId)
    .maybeSingle()
  if (m) {
    const periodLabel = (m.membership_periods as unknown as { label: string } | null)?.label ?? ''
    await sendMembershipActivatedEmails({
      memberEmail: session.email,
      memberName: `${session.profile.first_name ?? ''} ${session.profile.last_name ?? ''}`.trim(),
      tierLabel: tierLabel[m.tier] ?? m.tier,
      periodLabel,
      amountPence: m.amount_pence,
      method: settings.paymentProvider === 'simulated' ? 'card (simulated)' : 'card',
      paymentRef: m.paypal_capture_id,
    })
  }

  revalidatePath('/members/membership')
  revalidatePath('/admin')
  revalidatePath('/admin/members')
  return { ok: true, redirect: '/members/membership?paid=1' }
}

/** "Cancel and return" on the gateway — back to the treasurer path. */
export async function abandonOnlineOrderAction(orderRef: string): Promise<CheckoutResult> {
  if (!isSupabaseConfigured()) return { ok: false, message: NOT_CONFIGURED_MESSAGE }
  const session = await getSession()
  if (!session) return { ok: false, message: 'Log in first.' }
  if (!/^[A-Z0-9-]{8,64}$/i.test(orderRef)) return { ok: false, message: 'Invalid order' }

  const supabase = await createClient()
  const { error } = await supabase.rpc('abandon_online_payment', { p_order_ref: orderRef })
  if (error) return { ok: false, message: error.message }
  revalidatePath('/members/membership')
  return { ok: true, redirect: '/members/membership' }
}
