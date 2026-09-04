'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requireRole, getSession } from '@/lib/auth/guards'
import { sendMembershipActivatedEmails } from '@/lib/email/membership'
import { familyMemberSchema, familyPayload, type FamilyMemberInput } from '@/lib/membership/family'
import { isSupabaseConfigured, NOT_CONFIGURED_MESSAGE } from '@/lib/supabase/configured'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/lib/actions/auth'

const sourceLabel: Record<string, string> = {
  manual_bank: 'bank transfer',
  manual_cash: 'cash',
  complimentary: 'complimentary membership',
  paypal: 'card',
  imported: 'imported record',
}

const tierSchema = z.enum(['adult', 'junior', 'family'])

const requestSchema = z.object({
  tier: tierSchema,
  family: z.array(familyMemberSchema).max(12).default([]),
  periodId: z.uuid().optional(),
})

/** Self-service: creates/updates a PENDING membership; committee activates on payment. */
export async function requestMembershipAction(input: {
  tier: 'adult' | 'junior' | 'family'
  family?: FamilyMemberInput[]
  /** Renewal: request NEXT period while this year's membership is active. */
  periodId?: string
}): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return { ok: false, message: NOT_CONFIGURED_MESSAGE }
  const session = await getSession()
  if (!session) return { ok: false, message: 'Log in first, then choose your membership.' }
  const parsed = requestSchema.safeParse({
    tier: input.tier,
    family: input.family ?? [],
    periodId: input.periodId,
  })
  if (!parsed.success) return { ok: false, message: 'Choose a valid membership tier' }

  const supabase = await createClient()
  // p_family (jsonb) replaces p_family_names in migration 0019 — args cast until
  // types are regenerated against the migrated schema.
  const { error } = await supabase.rpc('request_membership', {
    p_tier: parsed.data.tier,
    p_family: familyPayload(parsed.data.family),
    ...(parsed.data.periodId ? { p_period_id: parsed.data.periodId } : {}),
  } as never)
  if (error) return { ok: false, message: error.message }
  revalidatePath('/members/membership')
  return {
    ok: true,
    message: 'Membership requested — pay the treasurer and the committee will confirm it.',
  }
}

const recordPaymentSchema = z.object({
  membershipId: z.uuid(),
  source: z.enum(['manual_bank', 'manual_cash', 'complimentary']),
  note: z.string().trim().max(500).optional(),
})

/** Committee: the money arrived — activate the membership (P4-06 manual path). */
export async function recordPaymentAction(
  input: z.infer<typeof recordPaymentSchema>
): Promise<ActionResult> {
  await requireRole('committee')
  const parsed = recordPaymentSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: 'Invalid payment details' }

  const supabase = await createClient()
  const { data: before } = await supabase
    .from('memberships')
    .select('*')
    .eq('id', parsed.data.membershipId)
    .maybeSingle()
  if (!before) return { ok: false, message: 'Membership not found' }
  if (before.status === 'active') return { ok: false, message: 'Already active' }

  const { error } = await supabase
    .from('memberships')
    .update({
      status: 'active',
      source: parsed.data.source,
      paid_at: new Date().toISOString(),
      notes: parsed.data.note || before.notes,
    })
    .eq('id', parsed.data.membershipId)
  if (error) return { ok: false, message: error.message }

  await supabase.rpc('audit', {
    p_action: 'membership.payment_recorded',
    p_entity: 'memberships',
    p_entity_id: parsed.data.membershipId,
    p_before: { status: before.status },
    p_after: { status: 'active', source: parsed.data.source },
  })

  // P4-06: the manual path sends the same notifications as an online payment
  // (silently skipped until the Resend key exists).
  const [{ data: payer }, { data: period }] = await Promise.all([
    supabase
      .from('profiles')
      .select('first_name, last_name, email')
      .eq('user_id', before.primary_user_id)
      .maybeSingle(),
    supabase
      .from('membership_periods')
      .select('label')
      .eq('id', before.period_id)
      .maybeSingle(),
  ])
  if (payer) {
    await sendMembershipActivatedEmails({
      memberEmail: payer.email,
      memberName: `${payer.first_name ?? ''} ${payer.last_name ?? ''}`.trim(),
      tierLabel: before.tier.charAt(0).toUpperCase() + before.tier.slice(1),
      periodLabel: period?.label ?? '',
      amountPence: before.amount_pence,
      method: sourceLabel[parsed.data.source] ?? parsed.data.source,
    })
  }

  revalidatePath('/admin/members')
  return { ok: true, message: 'Payment recorded — membership is now active' }
}

const cancelSchema = z.object({
  membershipId: z.uuid(),
  reason: z.string().trim().min(3, 'Give a short reason').max(500),
})

export async function cancelMembershipAction(
  input: z.infer<typeof cancelSchema>
): Promise<ActionResult> {
  await requireRole('committee')
  const parsed = cancelSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? 'Invalid' }

  const supabase = await createClient()
  const { data: before } = await supabase
    .from('memberships')
    .select('status, notes')
    .eq('id', parsed.data.membershipId)
    .maybeSingle()
  if (!before) return { ok: false, message: 'Membership not found' }

  const { error } = await supabase
    .from('memberships')
    .update({ status: 'cancelled', notes: parsed.data.reason })
    .eq('id', parsed.data.membershipId)
  if (error) return { ok: false, message: error.message }

  await supabase.rpc('audit', {
    p_action: 'membership.cancelled',
    p_entity: 'memberships',
    p_entity_id: parsed.data.membershipId,
    p_before: { status: before.status },
    p_after: { status: 'cancelled', reason: parsed.data.reason },
  })
  revalidatePath('/admin/members')
  return { ok: true, message: 'Membership cancelled' }
}

const refundSchema = z.object({
  membershipId: z.uuid(),
  note: z.string().trim().min(3, 'Say where the refund was issued').max(500),
})

/**
 * P4-07 — mark refunded (note only): the money moves in the provider's own
 * dashboard (or back over the counter); this records the outcome. With real
 * PayPal the webhook confirms it automatically — this is the manual twin.
 */
export async function markRefundedAction(
  input: z.infer<typeof refundSchema>
): Promise<ActionResult> {
  await requireRole('committee')
  const parsed = refundSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? 'Invalid' }

  const supabase = await createClient()
  const { data: before } = await supabase
    .from('memberships')
    .select('status, notes')
    .eq('id', parsed.data.membershipId)
    .maybeSingle()
  if (!before) return { ok: false, message: 'Membership not found' }
  if (before.status === 'refunded') return { ok: false, message: 'Already marked refunded' }

  const { error } = await supabase
    .from('memberships')
    .update({ status: 'refunded', notes: parsed.data.note })
    .eq('id', parsed.data.membershipId)
  if (error) return { ok: false, message: error.message }

  await supabase.rpc('audit', {
    p_action: 'membership.refunded',
    p_entity: 'memberships',
    p_entity_id: parsed.data.membershipId,
    p_before: { status: before.status },
    p_after: { status: 'refunded', note: parsed.data.note },
  })
  revalidatePath('/admin/members')
  return { ok: true, message: 'Marked refunded' }
}

const extendSchema = z.object({
  membershipId: z.uuid(),
  note: z.string().trim().max(500).optional(),
})

/** P4-07 — goodwill extension into the next period (active, complimentary, £0). */
export async function extendMembershipAction(
  input: z.infer<typeof extendSchema>
): Promise<ActionResult> {
  await requireRole('committee')
  const parsed = extendSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: 'Invalid request' }

  const supabase = await createClient()
  const { error } = await supabase.rpc('admin_extend_membership', {
    p_membership_id: parsed.data.membershipId,
    ...(parsed.data.note ? { p_note: parsed.data.note } : {}),
  })
  if (error) return { ok: false, message: error.message }
  revalidatePath('/admin/members')
  return { ok: true, message: 'Extended into the next membership year' }
}

const adminCreateSchema = z.object({
  userId: z.uuid(),
  tier: tierSchema,
  periodId: z.uuid(),
  source: z.enum(['manual_bank', 'manual_cash', 'complimentary', 'imported']),
  amountPence: z.number().int().min(0).max(100_000).optional(),
  activate: z.boolean().default(true),
  note: z.string().trim().max(500).optional(),
  family: z.array(familyMemberSchema).max(12).default([]),
})

/** P9-07 — grant a membership to an existing account (walk-up cash, imports). */
export async function adminCreateMembershipAction(input: {
  userId: string
  tier: 'adult' | 'junior' | 'family'
  periodId: string
  source: 'manual_bank' | 'manual_cash' | 'complimentary' | 'imported'
  amountPence?: number
  activate?: boolean
  note?: string
  family?: FamilyMemberInput[]
}): Promise<ActionResult> {
  await requireRole('committee')
  const parsed = adminCreateSchema.safeParse({
    ...input,
    activate: input.activate ?? true,
    family: input.family ?? [],
  })
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? 'Check the form' }

  const supabase = await createClient()
  // p_family (jsonb) replaces p_family_names in migration 0019 — args cast until
  // types are regenerated against the migrated schema.
  const { error } = await supabase.rpc('admin_create_membership', {
    p_user_id: parsed.data.userId,
    p_tier: parsed.data.tier,
    p_period_id: parsed.data.periodId,
    p_source: parsed.data.source,
    ...(parsed.data.amountPence !== undefined ? { p_amount_pence: parsed.data.amountPence } : {}),
    p_activate: parsed.data.activate,
    ...(parsed.data.note ? { p_note: parsed.data.note } : {}),
    p_family: familyPayload(parsed.data.family),
  } as never)
  if (error) return { ok: false, message: error.message }
  revalidatePath('/admin/members')
  revalidatePath('/admin')
  return {
    ok: true,
    message: parsed.data.activate ? 'Membership created and activated' : 'Membership created as pending',
  }
}

const updateProfileSchema = z.object({
  phone: z.string().trim().min(7, 'Enter a phone number').max(30),
  addressLine1: z.string().trim().min(1, 'Enter your address').max(200),
  addressLine2: z.string().trim().max(200).optional(),
  town: z.string().trim().min(1, 'Enter your town').max(100),
  postcode: z.string().trim().min(3, 'Enter your postcode').max(10),
  bcNumber: z.string().trim().max(30).optional(),
  emergencyContactName: z.string().trim().max(120).optional(),
  emergencyContactPhone: z.string().trim().max(30).optional(),
  emailOptIn: z.boolean(),
})

export async function updateProfileAction(
  input: z.infer<typeof updateProfileSchema>
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return { ok: false, message: NOT_CONFIGURED_MESSAGE }
  const session = await getSession()
  if (!session) return { ok: false, message: 'Log in first' }
  const parsed = updateProfileSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? 'Check the form' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({
      phone: parsed.data.phone,
      address_line1: parsed.data.addressLine1,
      address_line2: parsed.data.addressLine2 || null,
      town: parsed.data.town,
      postcode: parsed.data.postcode.toUpperCase(),
      bc_membership_number: parsed.data.bcNumber || null,
      emergency_contact_name: parsed.data.emergencyContactName || null,
      emergency_contact_phone: parsed.data.emergencyContactPhone || null,
      email_opt_in: parsed.data.emailOptIn,
    })
    .eq('user_id', session.userId)
  if (error) return { ok: false, message: error.message }
  revalidatePath('/members/profile')
  return { ok: true, message: 'Profile saved' }
}
