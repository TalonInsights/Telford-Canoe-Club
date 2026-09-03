import 'server-only'

import { formatMoneyGBP } from '@/lib/format'

/**
 * P4-04 — activation notifications: a receipt to the member and a heads-up to
 * the committee inbox. Resend-gated exactly like the contact form: without
 * RESEND_API_KEY (D5) both sends are skipped silently and the activation
 * itself is never blocked — email is a courtesy, the database is the truth.
 */
export async function sendMembershipActivatedEmails(input: {
  memberEmail: string | null
  memberName: string
  tierLabel: string
  periodLabel: string
  amountPence: number
  method: string
  paymentRef?: string | null
}): Promise<{ sent: boolean; reason?: string }> {
  if (!process.env.RESEND_API_KEY) return { sent: false, reason: 'no-resend-key' }

  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)
  const from = process.env.EMAIL_FROM ?? 'Telford Canoe Club <onboarding@resend.dev>'
  const amount = formatMoneyGBP(input.amountPence)
  const ref = input.paymentRef ? `\nPayment reference: ${input.paymentRef}` : ''

  const jobs: Promise<unknown>[] = []
  if (input.memberEmail) {
    jobs.push(
      resend.emails.send({
        from,
        to: input.memberEmail,
        subject: `Your Telford Canoe Club membership is active — ${input.periodLabel}`,
        text:
          `Hi ${input.memberName},\n\n` +
          `Your ${input.tierLabel.toLowerCase()} membership for ${input.periodLabel} is now active` +
          ` (${amount}, paid by ${input.method}).${ref}\n\n` +
          `What's next:\n` +
          `- Your members area is open: https://telford-canoe-club.vercel.app/members\n` +
          `- Session times and bookings: https://telford-canoe-club.vercel.app/events\n` +
          `- Site access details live under member notices.\n\n` +
          `See you on the water,\nTelford Canoe Club`,
      })
    )
  }
  if (process.env.EMAIL_COMMITTEE) {
    jobs.push(
      resend.emails.send({
        from,
        to: process.env.EMAIL_COMMITTEE,
        subject: `Membership activated: ${input.memberName} (${input.tierLabel}, ${input.periodLabel})`,
        text:
          `${input.memberName} — ${input.tierLabel}, ${input.periodLabel}, ${amount}, via ${input.method}.${ref}\n` +
          `Directory: https://telford-canoe-club.vercel.app/admin/members`,
      })
    )
  }
  try {
    await Promise.all(jobs)
    return { sent: jobs.length > 0 }
  } catch {
    return { sent: false, reason: 'send-failed' }
  }
}
