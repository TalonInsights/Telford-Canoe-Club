import { NextResponse } from 'next/server'

import { createAdminClient } from '@/lib/supabase/admin'
import { isSupabaseConfigured } from '@/lib/supabase/configured'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Retention for "who is on site" (0026). Rows are deleted 24 hours after the
 * session ends, so the club never accumulates a history of where its members
 * have been.
 *
 * Unlike the expiry sweep, the secret here is mandatory rather than advisory:
 * that one only makes data more correct, this one deletes, so an uninvited
 * caller must not be able to run it. The read policy already hides a finished
 * session, so a missed run cannot expose anything either.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorised' }, { status: 401 })
  }
  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ skipped: 'not configured' }, { status: 503 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase.rpc('purge_expired_checkins')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, removed: data })
}
