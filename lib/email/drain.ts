import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'

import { BATCH_SIZE, batchPause, sendCampaignBatch, type CampaignRecipient } from '@/lib/email/campaign'
import type { Database } from '@/types/database'

/**
 * Send whatever of a campaign is still queued, up to a limit of batches.
 *
 * Takes its database client rather than making one, because it is called from
 * two places with genuinely different authority: a committee member's own
 * session when they press send, and the service role from the cron that
 * finishes the job later, which has no session at all.
 */
export async function drainCampaign(
  supabase: SupabaseClient<Database>,
  campaignId: string,
  maxBatches: number
): Promise<{ sent: number; failed: number; remaining: number }> {
  const { data: campaign } = await supabase
    .from('email_campaigns')
    .select('subject, body')
    .eq('id', campaignId)
    .maybeSingle()
  if (!campaign) return { sent: 0, failed: 0, remaining: 0 }

  const body = (Array.isArray(campaign.body) ? campaign.body : []) as never
  let sent = 0
  let failed = 0

  for (let i = 0; i < maxBatches; i += 1) {
    const { data: queued } = await supabase
      .from('email_recipients')
      .select('id, user_id, email')
      .eq('campaign_id', campaignId)
      .eq('status', 'queued')
      .order('created_at', { ascending: true })
      .limit(BATCH_SIZE)
    if (!queued || queued.length === 0) break

    const userIds = queued.map((q) => q.user_id).filter(Boolean) as string[]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, first_name, unsubscribe_token')
      .in('user_id', userIds)
    const byUser = new Map((profiles ?? []).map((p) => [p.user_id, p]))

    const recipients: CampaignRecipient[] = queued.map((q) => {
      const profile = q.user_id ? byUser.get(q.user_id) : undefined
      return {
        id: q.id,
        email: q.email,
        firstName: profile?.first_name ?? null,
        unsubscribeToken: profile?.unsubscribe_token ?? null,
      }
    })

    const outcome = await sendCampaignBatch({ subject: campaign.subject, body, recipients })

    if (outcome.sent.length > 0) {
      await supabase.from('email_recipients').update({ status: 'sent' }).in('id', outcome.sent)
      sent += outcome.sent.length
    }
    for (const failure of outcome.failed) {
      await supabase
        .from('email_recipients')
        .update({ status: 'failed', error: failure.error.slice(0, 300) })
        .eq('id', failure.id)
    }
    failed += outcome.failed.length

    if (i < maxBatches - 1) await batchPause()
  }

  const { count: remaining } = await supabase
    .from('email_recipients')
    .select('id', { count: 'exact', head: true })
    .eq('campaign_id', campaignId)
    .eq('status', 'queued')

  // Only call it finished when the queue is actually empty.
  if ((remaining ?? 0) === 0) {
    await supabase
      .from('email_campaigns')
      .update({ status: failed > 0 && sent === 0 ? 'failed' : 'sent' })
      .eq('id', campaignId)
  }

  return { sent, failed, remaining: remaining ?? 0 }
}
