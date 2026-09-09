import 'server-only'

import { blocksToPlainText, bulletLines, pruneBlocks, type MinuteBlock } from '@/lib/minutes/blocks'

/**
 * Club news, as opposed to the transactional mail in bookings.ts and
 * membership.ts. Two rules separate the two, and they are the whole point of
 * this file:
 *
 *   1. Every message carries a working unsubscribe, both as a link people can
 *      see and as the List-Unsubscribe header mail clients act on.
 *   2. Nobody who has opted out is in the list to begin with; the recipient
 *      list is resolved in the database by `email_segment_recipients`, which
 *      excludes them.
 *
 * Sent in batches through Resend's batch endpoint, which takes up to 100 at a
 * time, with a pause between batches so a big send does not look like a spike.
 */

export const BATCH_SIZE = 50

/** Resend's own limit is 100 per call; 50 keeps each request comfortably small. */
export type CampaignRecipient = {
  id: string
  email: string
  firstName: string | null
  unsubscribeToken: string | null
}

export type BatchOutcome = {
  sent: string[]
  failed: { id: string; error: string }[]
}

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'https://telford-canoe-club.vercel.app'
}

export function unsubscribeUrl(token: string): string {
  return `${siteUrl()}/unsubscribe?token=${encodeURIComponent(token)}`
}

/** Blocks to plain text, the same words the composer previewed. */
export function renderCampaignText(
  body: MinuteBlock[],
  recipient: { firstName: string | null; unsubscribeToken: string | null }
): string {
  const parts: string[] = []
  const greeting = recipient.firstName?.trim()
  parts.push(greeting ? `Hi ${greeting},` : 'Hello,')

  for (const block of pruneBlocks(body)) {
    if (block.type === 'heading') parts.push(block.text.toUpperCase())
    else if (block.type === 'bullets') parts.push(bulletLines(block.text).map((l) => `- ${l}`).join('\n'))
    else parts.push(block.text)
  }

  parts.push('Telford Canoe Club')

  if (recipient.unsubscribeToken) {
    parts.push(
      `You are getting this because you are on the club's news list. ` +
        `To stop these, use this link, it takes one click: ${unsubscribeUrl(recipient.unsubscribeToken)}\n` +
        `Booking, membership and account emails are separate and will still reach you.`
    )
  }

  return parts.join('\n\n')
}

/** A one-line taste of a campaign, for the list of what has been sent. */
export function campaignPreview(body: MinuteBlock[], max = 120): string {
  const text = blocksToPlainText(body)
  return text.length <= max ? text : `${text.slice(0, max).trimEnd()}…`
}

/**
 * Send one batch. Never throws: a batch that fails comes back as failures per
 * recipient so the campaign can carry on and be retried, because a half-sent
 * campaign that stops dead is worse than one that records what happened.
 */
export async function sendCampaignBatch(input: {
  subject: string
  body: MinuteBlock[]
  recipients: CampaignRecipient[]
}): Promise<BatchOutcome> {
  if (input.recipients.length === 0) return { sent: [], failed: [] }

  if (!process.env.RESEND_API_KEY) {
    return {
      sent: [],
      failed: input.recipients.map((r) => ({ id: r.id, error: 'Email is not connected yet (D5)' })),
    }
  }

  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)
  const from = process.env.EMAIL_FROM ?? 'Telford Canoe Club <onboarding@resend.dev>'

  const messages = input.recipients.map((r) => ({
    from,
    to: r.email,
    subject: input.subject,
    text: renderCampaignText(input.body, r),
    ...(r.unsubscribeToken
      ? {
          headers: {
            // What a mail client's own "unsubscribe" button uses.
            'List-Unsubscribe': `<${unsubscribeUrl(r.unsubscribeToken)}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        }
      : {}),
  }))

  try {
    const { error } = await resend.batch.send(messages)
    if (error) {
      return {
        sent: [],
        failed: input.recipients.map((r) => ({ id: r.id, error: error.message })),
      }
    }
    return { sent: input.recipients.map((r) => r.id), failed: [] }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'send failed'
    return { sent: [], failed: input.recipients.map((r) => ({ id: r.id, error: message })) }
  }
}

/** A courtesy pause between batches, so a large send is not one spike. */
export function batchPause(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 1100))
}
