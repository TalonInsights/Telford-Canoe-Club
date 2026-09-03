import { NextResponse } from 'next/server'

import { isSupabaseConfigured } from '@/lib/supabase/configured'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * P4-08 — daily expiry sweep (vercel.json, 02:00 UTC): marks date-expired
 * memberships and moves is_current when the calendar rolls over. The database
 * function is idempotent and outcome-determined by the date, so an uninvited
 * caller can only make the data MORE correct — the secret check is about
 * tidiness, not safety.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorised' }, { status: 401 })
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ skipped: 'supabase not configured' }, { status: 503 })
  }
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('run_expiry_sweep')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, result: data })
}
