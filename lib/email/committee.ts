import 'server-only'

/**
 * A plain note to the committee inbox. Resend-gated like every other send: with
 * no RESEND_API_KEY (D5) it is skipped silently, and the caller never depends
 * on it — the durable record is always the audit log, email is the nudge.
 */
export async function notifyCommittee(input: {
  subject: string
  body: string
}): Promise<{ sent: boolean; reason?: string }> {
  if (!process.env.RESEND_API_KEY) return { sent: false, reason: 'no-resend-key' }
  const to = process.env.COMMITTEE_EMAIL ?? 'committee@telfordcanoeclub.co.uk'
  const from = process.env.EMAIL_FROM ?? 'Telford Canoe Club <onboarding@resend.dev>'
  try {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({ from, to, subject: input.subject, text: input.body })
    return { sent: true }
  } catch (e) {
    return { sent: false, reason: e instanceof Error ? e.message : 'send-failed' }
  }
}
