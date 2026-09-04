import 'server-only'

/**
 * P5-05 — booking notifications. Resend-gated exactly like membership mail:
 * without RESEND_API_KEY (D5) the send is skipped silently and the booking
 * itself is never blocked — the database is the truth, email is a courtesy.
 */

export type BookingEmailKind =
  | 'confirmed'
  | 'waitlist'
  | 'promoted'
  | 'cancelled_by_club'
  | 'event_cancelled'

export async function sendBookingEmail(input: {
  kind: BookingEmailKind
  to: string | null | undefined
  name: string
  eventTitle: string
  when: string
  location?: string | null
  slug: string
}): Promise<{ sent: boolean; reason?: string }> {
  if (!process.env.RESEND_API_KEY) return { sent: false, reason: 'no-resend-key' }
  if (!input.to) return { sent: false, reason: 'no-recipient' }

  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)
  const from = process.env.EMAIL_FROM ?? 'Telford Canoe Club <onboarding@resend.dev>'
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://telford-canoe-club.vercel.app'
  const link = `${site}/events/${input.slug}`
  const where = input.location ? `\nWhere: ${input.location}` : ''
  const greeting = `Hi ${input.name || 'there'},\n\n`
  const signoff = `\n\nSee you on the water,\nTelford Canoe Club`

  const copy: Record<BookingEmailKind, { subject: string; body: string }> = {
    confirmed: {
      subject: `You're confirmed: ${input.eventTitle}`,
      body:
        greeting +
        `You're confirmed for ${input.eventTitle}.\nWhen: ${input.when}${where}\n\n` +
        `Can't make it after all? Cancel from your bookings so someone on the waitlist can take the place: ${site}/members/events` +
        signoff,
    },
    waitlist: {
      subject: `You're on the waitlist: ${input.eventTitle}`,
      body:
        greeting +
        `${input.eventTitle} is full for now, so you're on the waitlist.\nWhen: ${input.when}${where}\n\n` +
        `If a place frees up you move straight in and we'll email you. Details: ${link}` +
        signoff,
    },
    promoted: {
      subject: `A place is yours: ${input.eventTitle}`,
      body:
        greeting +
        `Good news — a place has freed up and you're now confirmed for ${input.eventTitle}.\nWhen: ${input.when}${where}\n\n` +
        `Can't make it? Cancel from your bookings: ${site}/members/events` +
        signoff,
    },
    cancelled_by_club: {
      subject: `Your place has been cancelled: ${input.eventTitle}`,
      body:
        greeting +
        `The committee has cancelled your place for ${input.eventTitle} (${input.when}).\n\n` +
        `If that's a surprise, reply to this email and we'll sort it out. Other sessions: ${site}/events` +
        signoff,
    },
    event_cancelled: {
      subject: `Cancelled: ${input.eventTitle}`,
      body:
        greeting +
        `Sorry — ${input.eventTitle} (${input.when}) has been cancelled.\n\n` +
        `Keep an eye on the events page, sessions come back around quickly: ${site}/events` +
        signoff,
    },
  }

  const { subject, body } = copy[input.kind]
  try {
    await resend.emails.send({ from, to: input.to, subject, text: body })
    return { sent: true }
  } catch (e) {
    return { sent: false, reason: e instanceof Error ? e.message : 'send-failed' }
  }
}
