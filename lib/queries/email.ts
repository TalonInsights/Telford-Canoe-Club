import { emailSegments, type EmailSegment } from '@/lib/email/segments'
import { parseBlocks, type MinuteBlock } from '@/lib/minutes/blocks'
import { isSupabaseConfigured } from '@/lib/supabase/configured'
import { createClient } from '@/lib/supabase/server'

/**
 * Campaigns and who they went to. Committee-only by RLS (0013); these queries
 * add no gate of their own because there is nothing here a non-committee
 * session could reach.
 */

export type Campaign = {
  id: string
  subject: string
  body: MinuteBlock[]
  status: string
  segmentKey: EmailSegment | null
  recipientCount: number | null
  sentAt: string | null
  createdAt: string
  counts?: { queued: number; sent: number; failed: number }
}

export async function getCampaigns(): Promise<Campaign[]> {
  if (!isSupabaseConfigured()) return []
  const supabase = await createClient()
  const { data } = await supabase
    .from('email_campaigns')
    .select('id, subject, body, status, segment_key, recipient_count, sent_at, created_at')
    .order('created_at', { ascending: false })
  return (data ?? []).map((row) => ({
    id: row.id,
    subject: row.subject,
    body: parseBlocks(row.body),
    status: row.status,
    segmentKey: row.segment_key as EmailSegment | null,
    recipientCount: row.recipient_count,
    sentAt: row.sent_at,
    createdAt: row.created_at,
  }))
}

export async function getCampaign(id: string): Promise<Campaign | null> {
  if (!isSupabaseConfigured()) return null
  const supabase = await createClient()
  const { data } = await supabase
    .from('email_campaigns')
    .select('id, subject, body, status, segment_key, recipient_count, sent_at, created_at')
    .eq('id', id)
    .maybeSingle()
  if (!data) return null

  const { data: recipients } = await supabase
    .from('email_recipients')
    .select('status')
    .eq('campaign_id', id)

  const counts = { queued: 0, sent: 0, failed: 0 }
  for (const r of recipients ?? []) {
    if (r.status === 'queued') counts.queued += 1
    else if (r.status === 'failed') counts.failed += 1
    else counts.sent += 1
  }

  return {
    id: data.id,
    subject: data.subject,
    body: parseBlocks(data.body),
    status: data.status,
    segmentKey: data.segment_key as EmailSegment | null,
    recipientCount: data.recipient_count,
    sentAt: data.sent_at,
    createdAt: data.created_at,
    counts,
  }
}

/** How many people a group currently reaches, for the composer's preview. */
export async function getSegmentCounts(): Promise<Record<EmailSegment, number>> {
  const empty = { paid_members: 0, registered_unpaid: 0, everyone: 0 }
  if (!isSupabaseConfigured()) return empty
  const supabase = await createClient()

  const entries = await Promise.all(
    emailSegments.map(async (segment) => {
      const { data } = await supabase.rpc('email_segment_recipients', { p_segment: segment })
      return [segment, (data ?? []).length] as const
    })
  )
  return { ...empty, ...Object.fromEntries(entries) }
}

export { emailSegments, segmentLabels, segmentHints } from '@/lib/email/segments'
export type { EmailSegment } from '@/lib/email/segments'
