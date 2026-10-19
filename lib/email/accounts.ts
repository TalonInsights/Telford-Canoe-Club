import 'server-only'

/**
 * The "set your password" invite for an account the committee created on a
 * member's behalf. Resend-gated like every send (D5): with no key it is
 * skipped, so a test import can never email a real person even if the invite
 * switch is left on.
 */
export async function sendAccountInviteEmail(input: {
  to: string
  name: string
  link: string
}): Promise<{ sent: boolean; reason?: string }> {
  if (!process.env.RESEND_API_KEY) return { sent: false, reason: 'no-resend-key' }
  const from = process.env.EMAIL_FROM ?? 'Telford Canoe Club <onboarding@resend.dev>'
  const greeting = `Hi ${input.name || 'there'},\n\n`
  const body =
    greeting +
    `Telford Canoe Club has set up an account for you on the club website so your membership ` +
    `is all in one place.\n\n` +
    `Set your password to finish, it takes a moment:\n${input.link}\n\n` +
    `If you weren't expecting this, you can ignore the email and nothing changes.\n\n` +
    `See you on the water,\nTelford Canoe Club`
  try {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({ from, to: input.to, subject: 'Your Telford Canoe Club account', text: body })
    return { sent: true }
  } catch (e) {
    return { sent: false, reason: e instanceof Error ? e.message : 'send-failed' }
  }
}
