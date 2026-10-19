import { NextResponse } from 'next/server'

import { notifyCommittee } from '@/lib/email/committee'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Juniors turning 18 (Simon 5.4). Runs daily. flag_junior_18() does the work
 * in the database — find the newly-18 covered members on family memberships,
 * write an audit row for each, mark them so they are not flagged twice — and
 * returns whoever was flagged this run. We then nudge the committee inbox;
 * that send is best-effort and gated on Resend (D5), while the audit rows are
 * the durable record the committee reads in the change log.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorised' }, { status: 401 })
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ skipped: 'service key not configured' }, { status: 503 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase.rpc('flag_junior_18')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const flagged = data ?? []
  if (flagged.length === 0) return NextResponse.json({ ok: true, flagged: 0 })

  const names = flagged.map((r) => r.display_name).filter(Boolean)
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://telford-canoe-club.vercel.app'
  const email = await notifyCommittee({
    subject: `${flagged.length} junior${flagged.length === 1 ? '' : 's'} turned 18 — membership to sort`,
    body:
      `The following ${flagged.length === 1 ? 'person has' : 'people have'} turned 18 on a family ` +
      `membership and now need their own membership:\n\n` +
      names.map((n) => `  • ${n}`).join('\n') +
      `\n\nThey are flagged in the change log at ${site}/admin/audit. ` +
      `Set them up with their own membership from the admin members screen.`,
  })

  return NextResponse.json({ ok: true, flagged: flagged.length, emailed: email.sent })
}
