'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requireRole } from '@/lib/auth/guards'
import { renderCampaignText, sendCampaignBatch } from '@/lib/email/campaign'
import { drainCampaign } from '@/lib/email/drain'
import { MINUTE_BLOCK_TYPES, pruneBlocks } from '@/lib/minutes/blocks'
import { emailSegments } from '@/lib/email/segments'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/lib/actions/auth'

/**
 * Emailing the members.
 *
 * The shape is deliberate: a campaign is written, then its recipients are
 * frozen into `email_recipients` at the moment of sending, then batches are
 * drained. Freezing first means a send can be resumed, can be counted
 * honestly, and cannot silently change under you if somebody joins or
 * unsubscribes halfway through.
 *
 * Opt-outs are handled at the source. The recipient list comes from
 * `email_segment_recipients`, which excludes anybody who has opted out of club
 * news, so there is no path in this file that can email them by accident.
 */

const blockSchema = z.object({
  type: z.enum(MINUTE_BLOCK_TYPES),
  text: z.string().max(5000),
})

const campaignSchema = z.object({
  id: z.uuid().optional(),
  subject: z.string().trim().min(3, 'Give the email a subject').max(160),
  body: z.array(blockSchema).max(80),
  segment: z.enum(emailSegments),
})

export type CampaignInput = z.input<typeof campaignSchema>

/** How many batches one call will drain before leaving the rest to the cron. */
const MAX_BATCHES_PER_CALL = 6

function revalidateEmail(id?: string) {
  revalidatePath('/admin/email')
  if (id) revalidatePath(`/admin/email/${id}`)
}

export async function saveCampaignAction(
  input: CampaignInput
): Promise<ActionResult & { id?: string }> {
  const session = await requireRole('committee')
  const parsed = campaignSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Check the email' }
  }
  const v = parsed.data
  const supabase = await createClient()

  const row = { subject: v.subject, body: v.body, segment_key: v.segment }

  if (v.id) {
    const { data: existing } = await supabase
      .from('email_campaigns')
      .select('status')
      .eq('id', v.id)
      .maybeSingle()
    if (existing && existing.status !== 'draft') {
      return { ok: false, message: 'That email has already been sent, start a new one' }
    }
    const { error } = await supabase.from('email_campaigns').update(row).eq('id', v.id)
    if (error) return { ok: false, message: error.message }
    revalidateEmail(v.id)
    return { ok: true, id: v.id, message: 'Draft saved' }
  }

  const { data, error } = await supabase
    .from('email_campaigns')
    .insert({ ...row, status: 'draft', sent_by: session.userId })
    .select('id')
    .single()
  if (error) return { ok: false, message: error.message }

  revalidateEmail(data.id)
  return { ok: true, id: data.id, message: 'Draft saved' }
}

/** A single copy to the person composing, so they can see the real thing. */
export async function sendTestEmailAction(input: CampaignInput): Promise<ActionResult> {
  const session = await requireRole('committee')
  const parsed = campaignSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Check the email' }
  }
  if (!session.email) return { ok: false, message: 'Your account has no email address' }

  const supabase = await createClient()
  const { data: me } = await supabase
    .from('profiles')
    .select('first_name, unsubscribe_token')
    .eq('user_id', session.userId)
    .maybeSingle()

  const outcome = await sendCampaignBatch({
    subject: `[Test] ${parsed.data.subject}`,
    body: parsed.data.body,
    recipients: [
      {
        id: session.userId,
        email: session.email,
        firstName: me?.first_name ?? null,
        unsubscribeToken: me?.unsubscribe_token ?? null,
      },
    ],
  })

  if (outcome.failed.length > 0) {
    return { ok: false, message: outcome.failed[0].error }
  }
  return { ok: true, message: `Test sent to ${session.email}` }
}

/**
 * Freeze the recipients, then start sending. Returns as soon as the first few
 * batches are away; anything left queued is picked up by the cron drainer, so
 * a big list cannot run into a request timeout half-finished.
 */
export async function sendCampaignAction(id: string): Promise<ActionResult> {
  await requireRole('committee')
  if (!z.uuid().safeParse(id).success) return { ok: false, message: 'Unknown email' }

  const supabase = await createClient()
  const { data: campaign } = await supabase
    .from('email_campaigns')
    .select('id, subject, body, status, segment_key')
    .eq('id', id)
    .maybeSingle()
  if (!campaign) return { ok: false, message: 'Email not found' }
  if (campaign.status !== 'draft') return { ok: false, message: 'That email has already been sent' }
  if (!campaign.segment_key) return { ok: false, message: 'Choose who it goes to first' }

  const body = Array.isArray(campaign.body) ? campaign.body : []
  if (pruneBlocks(body as never).length === 0) {
    return { ok: false, message: 'Write something before sending it' }
  }

  const { data: people, error: segmentError } = await supabase.rpc('email_segment_recipients', {
    p_segment: campaign.segment_key,
  })
  if (segmentError) return { ok: false, message: segmentError.message }
  if (!people || people.length === 0) {
    return { ok: false, message: 'Nobody is in that group at the moment' }
  }

  // Freeze the list. From here the campaign is about these people, whatever
  // happens to the membership table afterwards.
  const { error: snapshotError } = await supabase.from('email_recipients').insert(
    people.map((p) => ({ campaign_id: id, user_id: p.user_id, email: p.email, status: 'queued' }))
  )
  if (snapshotError) return { ok: false, message: snapshotError.message }

  await supabase
    .from('email_campaigns')
    .update({
      status: 'sending',
      recipient_count: people.length,
      segment_snapshot: { segment: campaign.segment_key, count: people.length },
      sent_at: new Date().toISOString(),
    })
    .eq('id', id)

  await supabase.rpc('audit', {
    p_action: 'email.campaign_sending',
    p_entity: 'email_campaigns',
    p_entity_id: id,
    p_after: { subject: campaign.subject, segment: campaign.segment_key, recipients: people.length },
  })

  const drained = await drainCampaign(supabase, id, MAX_BATCHES_PER_CALL)
  revalidateEmail(id)

  return {
    ok: true,
    message:
      drained.remaining > 0
        ? `Sending. ${drained.sent} away, ${drained.remaining} still going out in the background.`
        : `Sent to ${drained.sent} ${drained.sent === 1 ? 'person' : 'people'}.`,
  }
}

export async function deleteCampaignAction(id: string): Promise<ActionResult> {
  await requireRole('committee')
  if (!z.uuid().safeParse(id).success) return { ok: false, message: 'Unknown email' }

  const supabase = await createClient()
  const { data: before } = await supabase
    .from('email_campaigns')
    .select('subject, status')
    .eq('id', id)
    .maybeSingle()
  if (!before) return { ok: false, message: 'Not found' }
  if (before.status !== 'draft') {
    return { ok: false, message: 'A sent email stays in the record and cannot be deleted' }
  }

  const { error } = await supabase.from('email_campaigns').delete().eq('id', id)
  if (error) return { ok: false, message: error.message }

  revalidateEmail()
  return { ok: true, message: 'Draft deleted' }
}

/** Used by the composer's preview so it shows the words that will actually go. */
export async function previewCampaignAction(
  input: CampaignInput
): Promise<{ ok: true; text: string } | { ok: false; message: string }> {
  await requireRole('committee')
  const parsed = campaignSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Check the email' }
  }
  return {
    ok: true,
    text: renderCampaignText(parsed.data.body, {
      firstName: 'Sam',
      unsubscribeToken: '00000000-0000-0000-0000-000000000000',
    }),
  }
}
