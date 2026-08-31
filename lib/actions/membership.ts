'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requireRole, getSession } from '@/lib/auth/guards'
import { isSupabaseConfigured, NOT_CONFIGURED_MESSAGE } from '@/lib/supabase/configured'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/lib/actions/auth'

const tierSchema = z.enum(['adult', 'junior', 'family'])

const requestSchema = z.object({
  tier: tierSchema,
  familyNames: z.array(z.string().trim().max(120)).max(12).default([]),
})

/** Self-service: creates/updates a PENDING membership; committee activates on payment. */
export async function requestMembershipAction(input: {
  tier: 'adult' | 'junior' | 'family'
  familyNames?: string[]
}): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return { ok: false, message: NOT_CONFIGURED_MESSAGE }
  const session = await getSession()
  if (!session) return { ok: false, message: 'Log in first, then choose your membership.' }
  const parsed = requestSchema.safeParse({ tier: input.tier, familyNames: input.familyNames ?? [] })
  if (!parsed.success) return { ok: false, message: 'Choose a valid membership tier' }

  const supabase = await createClient()
  const { error } = await supabase.rpc('request_membership', {
    p_tier: parsed.data.tier,
    p_family_names: parsed.data.familyNames,
  })
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
