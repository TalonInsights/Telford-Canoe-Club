import { NextResponse } from 'next/server'

import { drainCampaign } from '@/lib/email/drain'
import { createAdminClient } from '@/lib/supabase/admin'
import { isSupabaseConfigured } from '@/lib/supabase/configured'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Finishes what a send started. A campaign freezes its recipients and sends
 * the first few batches while the committee member watches; anything left is
 * drained here, so a long list cannot be cut in half by a request timeout.
 *
 * The secret is mandatory: this sends email, so an uninvited caller must not
 * be able to trigger it.
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
  const { data: sending } = await supabase
    .from('email_campaigns')
    .select('id')
    .eq('status', 'sending')
    .order('created_at', { ascending: true })
    .limit(3)

  if (!sending || sending.length === 0) {
    return NextResponse.json({ ok: true, drained: 0 })
  }

  const results = []
  for (const campaign of sending) {
    results.push({ id: campaign.id, ...(await drainCampaign(supabase, campaign.id, 4)) })
  }
  return NextResponse.json({ ok: true, campaigns: results })
}
