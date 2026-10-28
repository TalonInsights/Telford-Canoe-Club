'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requireRole } from '@/lib/auth/guards'
import { sendAccountInviteEmail } from '@/lib/email/accounts'
import { isJuniorDob } from '@/lib/schemas/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

/**
 * Admin-created accounts for existing members, and the bulk import behind them
 * (5.5 / 5.6). The committee can stand up accounts from the old member list so
 * nobody has to self-register; each person is later sent a "set your password"
 * link.
 *
 * Two safety rails, because this touches real people:
 *  - **Dry run** writes nothing. It parses, validates and tells the committee
 *    exactly what would happen, so a messy paste is caught before any account
 *    exists.
 *  - **Invites are off by default and gated on Resend (D5).** Creating an
 *    account never emails anyone; an invite goes out only when the committee
 *    deliberately turns it on AND the club's email is live. So a test import
 *    cannot reach a real inbox.
 *
 * Idempotent: a row whose email already has a profile is skipped, not
 * duplicated, so a re-run after a half-finished import is safe.
 */

const rowSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().trim().toLowerCase().pipe(z.email()),
})

const inputSchema = z.object({
  rows: z.array(rowSchema).min(1, 'Add at least one person').max(100, 'Do at most 100 at a time'),
  dryRun: z.boolean(),
  sendInvites: z.boolean(),
})

export type AccountRowInput = z.input<typeof rowSchema>
export type AccountImportInput = z.input<typeof inputSchema>

export type RowOutcome = {
  email: string
  name: string
  outcome: 'would-create' | 'created' | 'invited' | 'already-exists' | 'error'
  detail?: string
}

export type ImportResult =
  | { ok: false; message: string }
  | { ok: true; dryRun: boolean; invitesRequested: boolean; emailLive: boolean; rows: RowOutcome[] }

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://telford-canoe-club.vercel.app'

export async function adminCreateAccountsAction(input: AccountImportInput): Promise<ImportResult> {
  await requireRole('admin')
  const parsed = inputSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? 'Check the list' }
  const { rows, dryRun, sendInvites } = parsed.data

  // Collapse duplicate emails within the paste itself.
  const seen = new Set<string>()
  const unique = rows.filter((r) => (seen.has(r.email) ? false : (seen.add(r.email), true)))

  const supabase = await createClient()
  const { data: existingProfiles } = await supabase
    .from('profiles')
    .select('email')
    .in(
      'email',
      unique.map((r) => r.email)
    )
  const existing = new Set((existingProfiles ?? []).map((p) => p.email.toLowerCase()))

  const emailLive = Boolean(process.env.RESEND_API_KEY)
  const results: RowOutcome[] = []

  // Dry run: classify only, touch nothing.
  if (dryRun) {
    for (const r of unique) {
      results.push({
        email: r.email,
        name: `${r.firstName} ${r.lastName}`,
        outcome: existing.has(r.email) ? 'already-exists' : 'would-create',
      })
    }
    return { ok: true, dryRun: true, invitesRequested: sendInvites, emailLive, rows: results }
  }

  const admin = createAdminClient()
  let created = 0
  let skipped = 0

  for (const r of unique) {
    const name = `${r.firstName} ${r.lastName}`
    if (existing.has(r.email)) {
      results.push({ email: r.email, name, outcome: 'already-exists' })
      skipped += 1
      continue
    }

    const { data, error } = await admin.auth.admin.createUser({
      email: r.email,
      email_confirm: true,
      user_metadata: { first_name: r.firstName, last_name: r.lastName },
    })
    if (error || !data.user) {
      results.push({ email: r.email, name, outcome: 'error', detail: error?.message ?? 'could not create' })
      continue
    }
    created += 1

    await supabase.rpc('audit', {
      p_action: 'account.admin_created',
      p_entity: 'profiles',
      p_entity_id: data.user.id,
      p_after: { email: r.email, name, invited: sendInvites && emailLive },
    })

    // The set-password invite: only when asked for AND the club's email is live.
    let invited = false
    if (sendInvites && emailLive) {
      const { data: link } = await admin.auth.admin.generateLink({
        type: 'recovery',
        email: r.email,
        options: { redirectTo: `${SITE}/auth/callback?next=/reset-password` },
      })
      const actionLink = link?.properties?.action_link
      if (actionLink) {
        const sent = await sendAccountInviteEmail({ to: r.email, name, link: actionLink })
        invited = sent.sent
      }
    }
    results.push({ email: r.email, name, outcome: invited ? 'invited' : 'created' })
  }

  // A durable record of the run.
  await supabase.from('import_batches').insert({
    source: 'admin_create',
    row_count: unique.length,
    imported_count: created,
    skipped_count: skipped,
    log: { invites_requested: sendInvites, email_live: emailLive },
  })

  revalidatePath('/admin/members')
  return { ok: true, dryRun: false, invitesRequested: sendInvites, emailLive, rows: results }
}

/**
 * Add ONE member and carry their details across (Simon, 28 Oct). The guided
 * form in the admin area is for typing a returning member's record in full:
 * the account is created and the whole profile is filled in one go — name,
 * date of birth, contact, emergency contact, governing-body number, car reg —
 * so nothing is lost in the move from the old system.
 *
 * Same email rail as the bulk import: creating the account never emails anyone;
 * the set-password invite is off unless asked for AND the club email is live.
 */
const memberSchema = z.object({
  firstName: z.string().trim().min(1, 'Enter a first name').max(80),
  lastName: z.string().trim().min(1, 'Enter a last name').max(80),
  email: z.string().trim().toLowerCase().pipe(z.email()),
  dateOfBirth: z
    .string()
    .trim()
    .refine((v) => {
      if (!v) return true
      const d = new Date(v)
      return !Number.isNaN(+d) && d < new Date() && d > new Date('1900-01-01')
    }, 'Enter a real date of birth')
    .optional(),
  phone: z.string().trim().max(30).optional(),
  addressLine1: z.string().trim().max(200).optional(),
  addressLine2: z.string().trim().max(200).optional(),
  town: z.string().trim().max(100).optional(),
  postcode: z.string().trim().max(12).optional(),
  emergencyContactName: z.string().trim().max(120).optional(),
  emergencyContactPhone: z.string().trim().max(30).optional(),
  guardianName: z.string().trim().max(120).optional(),
  guardianPhone: z.string().trim().max(30).optional(),
  bcNumber: z.string().trim().max(30).optional(),
  carRegistration: z.string().trim().max(15).optional(),
  sendInvite: z.boolean(),
})

export type CreateMemberInput = z.input<typeof memberSchema>

export type CreateMemberResult =
  | { ok: false; message: string }
  | { ok: true; userId: string; name: string; invited: boolean; emailLive: boolean }

export async function adminCreateMemberAction(input: CreateMemberInput): Promise<CreateMemberResult> {
  await requireRole('admin')
  const parsed = memberSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? 'Check the form' }
  const v = parsed.data

  // Same under-18 rule as the join form: a junior needs a named adult.
  if (v.dateOfBirth && isJuniorDob(v.dateOfBirth)) {
    if (!v.guardianName?.trim() || !v.guardianPhone?.trim()) {
      return { ok: false, message: "This member is under 18, so a parent or guardian's name and phone are needed" }
    }
  }

  const supabase = await createClient()
  const { data: existing } = await supabase
    .from('profiles')
    .select('email')
    .eq('email', v.email)
    .maybeSingle()
  if (existing) {
    return {
      ok: false,
      message: 'An account with that email already exists — edit that member from the members list instead',
    }
  }

  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.createUser({
    email: v.email,
    email_confirm: true,
    user_metadata: { first_name: v.firstName, last_name: v.lastName },
  })
  if (error || !data.user) return { ok: false, message: error?.message ?? 'Could not create the account' }
  const userId = data.user.id
  const name = `${v.firstName} ${v.lastName}`

  // Fill in the record the trigger created a shell for. Runs as the acting
  // admin, so the name / date-of-birth guard (0032) and committee RLS both
  // allow it; the change is audited by the profiles trigger too.
  const { error: upErr } = await supabase
    .from('profiles')
    .update({
      first_name: v.firstName,
      last_name: v.lastName,
      date_of_birth: v.dateOfBirth || null,
      phone: v.phone || null,
      address_line1: v.addressLine1 || null,
      address_line2: v.addressLine2 || null,
      town: v.town || null,
      postcode: v.postcode ? v.postcode.toUpperCase() : null,
      emergency_contact_name: v.emergencyContactName || null,
      emergency_contact_phone: v.emergencyContactPhone || null,
      guardian_name: v.guardianName || null,
      guardian_phone: v.guardianPhone || null,
      bc_membership_number: v.bcNumber || null,
      car_registration: v.carRegistration
        ? v.carRegistration.toUpperCase().replace(/\s+/g, ' ').trim()
        : null,
    })
    .eq('user_id', userId)
  if (upErr) {
    return {
      ok: false,
      message: `The account was created but their details did not save (${upErr.message}). Open the member and finish it there.`,
    }
  }

  await supabase.rpc('audit', {
    p_action: 'account.admin_created',
    p_entity: 'profiles',
    p_entity_id: userId,
    p_after: { email: v.email, name, carried_over: true },
  })

  const emailLive = Boolean(process.env.RESEND_API_KEY)
  let invited = false
  if (v.sendInvite && emailLive) {
    const { data: link } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email: v.email,
      options: { redirectTo: `${SITE}/auth/callback?next=/reset-password` },
    })
    const actionLink = link?.properties?.action_link
    if (actionLink) {
      const sent = await sendAccountInviteEmail({ to: v.email, name, link: actionLink })
      invited = sent.sent
    }
  }

  await supabase.from('import_batches').insert({
    source: 'admin_create_single',
    row_count: 1,
    imported_count: 1,
    skipped_count: 0,
    log: { invited, email_live: emailLive },
  })

  revalidatePath('/admin/members')
  return { ok: true, userId, name, invited, emailLive }
}
