import { NextResponse } from 'next/server'

import { formatMoneyGBP } from '@/lib/format'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Reminder days per §P4-08: 1 Dec, 15 Dec, 2 Jan (UK dates). */
function isReminderDay(now: Date): boolean {
  const d = now.getUTCDate()
  const m = now.getUTCMonth() + 1
  return (m === 12 && (d === 1 || d === 15)) || (m === 1 && d === 2)
}

/**
 * P4-08 — renewal reminders. Runs daily but only acts on the three reminder
 * days. DRY-RUN by default (logs the candidate count instead of sending);
 * set RENEWAL_REMINDERS_DRY_RUN=false once Resend + the service key exist.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorised' }, { status: 401 })
  }
  if (!isReminderDay(new Date()) && !request.headers.get('x-tcc-force')) {
    return NextResponse.json({ skipped: 'not a reminder day (1 Dec, 15 Dec, 2 Jan)' })
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ skipped: 'service key not configured' }, { status: 503 })
  }

  const supabase = createAdminClient()

  // Current period + the one after it
  const { data: periods } = await supabase
    .from('membership_periods')
    .select('id, label, starts_on, ends_on, is_current')
    .order('starts_on', { ascending: true })
  const current = periods?.find((p) => p.is_current)
  const next = current ? periods?.find((p) => p.starts_on > current.ends_on) : null
  if (!current || !next) return NextResponse.json({ skipped: 'no next period yet' })

  // Everyone active now…
  const { data: activeNow } = await supabase
    .from('memberships')
    .select('primary_user_id, tier')
    .eq('period_id', current.id)
    .eq('status', 'active')
  // …minus anyone already sorted (active or pending) for next year
  const { data: sortedNext } = await supabase
    .from('memberships')
    .select('primary_user_id')
    .eq('period_id', next.id)
    .in('status', ['active', 'pending'])
  const sorted = new Set((sortedNext ?? []).map((m) => m.primary_user_id))
  const candidates = (activeNow ?? []).filter((m) => !sorted.has(m.primary_user_id))
  if (candidates.length === 0) return NextResponse.json({ ok: true, candidates: 0 })

  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, first_name, email, email_opt_in')
    .in('user_id', candidates.map((c) => c.primary_user_id))
  const sendable = (profiles ?? []).filter((p) => p.email && p.email_opt_in !== false)

  const dryRun = (process.env.RENEWAL_REMINDERS_DRY_RUN ?? 'true') !== 'false'
  if (dryRun || !process.env.RESEND_API_KEY) {
    console.log(`[renewal-reminders] dry-run: ${sendable.length} reminder(s) would send for ${next.label}`)
    return NextResponse.json({ ok: true, dryRun: true, wouldSend: sendable.length, period: next.label })
  }

  const { data: settings } = await supabase.from('club_settings').select('*').maybeSingle()
  const priceByTier: Record<string, number> = {
    adult: settings?.price_adult_pence ?? 2500,
    junior: settings?.price_junior_pence ?? 1500,
    family: settings?.price_family_pence ?? 4000,
  }
  const tierByUser = new Map(candidates.map((c) => [c.primary_user_id, c.tier]))

  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)
  const from = process.env.EMAIL_FROM ?? 'Telford Canoe Club <onboarding@resend.dev>'
  let sent = 0
  for (const p of sendable) {
    const tier = tierByUser.get(p.user_id) ?? 'adult'
    const { error } = await resend.emails.send({
      from,
      to: p.email!,
      subject: `Renew your Telford Canoe Club membership for ${next.label}`,
      text:
        `Hi ${p.first_name ?? 'there'},\n\n` +
        `Your ${current.label} membership wraps up soon — renewing for ${next.label} takes two minutes ` +
        `(${tier} membership, ${formatMoneyGBP(priceByTier[tier])}).\n\n` +
        `Renew here: https://telford-canoe-club.vercel.app/welcome?renew=1\n` +
        `Prefer bank transfer or cash? The same page shows the treasurer route.\n\n` +
        `See you on the water,\nTelford Canoe Club\n\n` +
        `You can switch these emails off in your profile: https://telford-canoe-club.vercel.app/members/profile`,
    })
    if (!error) sent += 1
  }
  return NextResponse.json({ ok: true, sent, of: sendable.length, period: next.label })
}
