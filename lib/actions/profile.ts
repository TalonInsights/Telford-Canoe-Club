'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { getSession, requireRole, roleAtLeast } from '@/lib/auth/guards'
import { isJuniorDob, ukPostcode } from '@/lib/schemas/auth'
import { isSupabaseConfigured, NOT_CONFIGURED_MESSAGE } from '@/lib/supabase/configured'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/lib/actions/auth'

/**
 * Member records: the member's own edits, and the committee's.
 *
 * Neither of these writes an audit entry by hand. A trigger on `profiles`
 * (0031) records every change, whichever screen it came from, so there is no
 * path through this file — or any future one — that can change a record
 * quietly.
 *
 * Three fields are not ordinary details, and none of them is edited here by a
 * member or by the committee:
 *
 * - **Name and date of birth** are fixed at sign-up and changed only by an
 *   admin (0032). They are what ties a membership record to a person, and the
 *   date decides junior status and so safeguarding.
 * - **Email address** is not editable by anybody, including an admin.
 *   `profiles.email` mirrors the login address; writing it directly would
 *   leave somebody logging in with the old one while club email went to the
 *   new one. Changing it properly needs the account holder to confirm the new
 *   address, which waits on the club's email being set up.
 */

const contactFields = {
  phone: z.string().trim().min(7, 'Enter a phone number').max(30),
  addressLine1: z.string().trim().min(1, 'Enter the address').max(200),
  addressLine2: z.string().trim().max(200).optional(),
  town: z.string().trim().min(1, 'Enter the town').max(100),
  postcode: z.string().trim().regex(ukPostcode, 'Enter a postcode like TF8 7HJ'),
  bcNumber: z.string().trim().max(30).optional(),
  emergencyContactName: z.string().trim().max(120).optional(),
  emergencyContactPhone: z.string().trim().max(30).optional(),
  guardianName: z.string().trim().max(120).optional(),
  guardianPhone: z.string().trim().max(30).optional(),
}

const identityFields = {
  firstName: z.string().trim().min(1, 'Enter a first name').max(80),
  lastName: z.string().trim().min(1, 'Enter a last name').max(80),
  dateOfBirth: z
    .string()
    .trim()
    .refine((v) => {
      if (!v) return true
      const d = new Date(v)
      return !Number.isNaN(+d) && d < new Date() && d > new Date('1900-01-01')
    }, 'Enter a real date of birth')
    .optional(),
}

const ownProfileSchema = z.object({ ...contactFields, emailOptIn: z.boolean() })

const memberProfileSchema = z.object({
  userId: z.uuid(),
  ...contactFields,
  ...identityFields,
  emailOptIn: z.boolean(),
})

export type OwnProfileInput = z.input<typeof ownProfileSchema>
export type MemberProfileInput = z.input<typeof memberProfileSchema>

/** Under-18 records need a named adult, the same rule the join form applies. */
function guardianIssue(dob: string | null, name?: string, phone?: string): string | null {
  if (!dob || !isJuniorDob(dob)) return null
  if (!name?.trim()) return "Under-18 records need a parent or guardian's name"
  if (!phone?.trim()) return "Under-18 records need a parent or guardian's phone number"
  return null
}

function contactColumns(v: z.infer<typeof ownProfileSchema>) {
  return {
    phone: v.phone,
    address_line1: v.addressLine1,
    address_line2: v.addressLine2 || null,
    town: v.town,
    postcode: v.postcode.toUpperCase(),
    bc_membership_number: v.bcNumber || null,
    emergency_contact_name: v.emergencyContactName || null,
    emergency_contact_phone: v.emergencyContactPhone || null,
    guardian_name: v.guardianName || null,
    guardian_phone: v.guardianPhone || null,
  }
}

/** A member editing their own record. Never their name or date of birth. */
export async function updateProfileAction(input: OwnProfileInput): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return { ok: false, message: NOT_CONFIGURED_MESSAGE }
  const session = await getSession()
  if (!session) return { ok: false, message: 'Log in first' }

  const parsed = ownProfileSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Check the form' }
  }
  const v = parsed.data

  const guardian = guardianIssue(
    session.profile.date_of_birth,
    v.guardianName,
    v.guardianPhone
  )
  if (guardian) return { ok: false, message: guardian }

  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({ ...contactColumns(v), email_opt_in: v.emailOptIn })
    .eq('user_id', session.userId)

  if (error) return { ok: false, message: error.message }
  revalidatePath('/members/profile')
  revalidatePath('/members')
  return { ok: true, message: 'Your details are saved' }
}

/**
 * The committee editing somebody's record — and an admin, who can also change
 * the name and date of birth the rest of us cannot.
 *
 * Club news consent can be turned off here but never on: honouring "stop
 * emailing me" is admin, recording a consent on somebody's behalf is not. Only
 * the member can opt themselves back in, from their own profile.
 */
export async function updateMemberProfileAction(
  input: MemberProfileInput
): Promise<ActionResult> {
  const session = await requireRole('committee')
  const parsed = memberProfileSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Check the form' }
  }
  const v = parsed.data
  const isAdmin = roleAtLeast(session.profile.role, 'admin')

  const supabase = await createClient()
  const { data: before } = await supabase
    .from('profiles')
    .select('email_opt_in, date_of_birth, first_name, last_name')
    .eq('user_id', v.userId)
    .maybeSingle()
  if (!before) return { ok: false, message: 'That member record no longer exists' }

  const wantsIdentityChange =
    v.firstName !== (before.first_name ?? '') ||
    v.lastName !== (before.last_name ?? '') ||
    (v.dateOfBirth || null) !== before.date_of_birth

  if (wantsIdentityChange && !isAdmin) {
    return {
      ok: false,
      message: 'A name or date of birth is changed by an admin, everything else you can edit',
    }
  }

  const dob = isAdmin ? v.dateOfBirth || null : before.date_of_birth
  const guardian = guardianIssue(dob, v.guardianName, v.guardianPhone)
  if (guardian) return { ok: false, message: guardian }

  const { error } = await supabase
    .from('profiles')
    .update({
      ...contactColumns(v),
      email_opt_in: before.email_opt_in ? v.emailOptIn : false,
      ...(isAdmin ? { first_name: v.firstName, last_name: v.lastName, date_of_birth: dob } : {}),
    })
    .eq('user_id', v.userId)

  if (error) return { ok: false, message: error.message }

  revalidatePath(`/admin/members/${v.userId}`)
  revalidatePath('/admin/members')
  revalidatePath('/admin/audit')
  return {
    ok: true,
    message:
      !before.email_opt_in && v.emailOptIn
        ? 'Record saved. Club news stays off — only they can turn it back on.'
        : 'Record saved',
  }
}
