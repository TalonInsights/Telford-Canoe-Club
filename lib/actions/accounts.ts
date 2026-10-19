'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requireRole } from '@/lib/auth/guards'
import { sendAccountInviteEmail } from '@/lib/email/accounts'
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
