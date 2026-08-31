'use server'

import { z } from 'zod'

import type { ActionResult } from '@/lib/actions/auth'

const contactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.email(),
  message: z.string().trim().min(10).max(4000),
  website: z.string().max(0).optional(),
})

// In-memory rate limit: 5/min per runtime instance (P2-21). Resend delivery
// to EMAIL_COMMITTEE plugs in here the moment RESEND_API_KEY exists.
const hits: number[] = []

export async function sendContactAction(input: z.infer<typeof contactSchema>): Promise<ActionResult> {
  const parsed = contactSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: 'Check the form and try again' }
  if (parsed.data.website) return { ok: true, message: 'Thanks!' } // honeypot: swallow silently

  const now = Date.now()
  while (hits.length && hits[0] < now - 60_000) hits.shift()
  if (hits.length >= 5) {
    return { ok: false, message: 'Too many messages at once — wait a minute and try again' }
  }
  hits.push(now)

  if (!process.env.RESEND_API_KEY) {
    return {
      ok: false,
      message:
        'The contact form isn’t switched on quite yet — email committee@telfordcanoeclub.co.uk directly and we’ll pick it up.',
    }
  }

  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM ?? 'Telford Canoe Club <onboarding@resend.dev>',
    to: process.env.EMAIL_COMMITTEE ?? 'committee@telfordcanoeclub.co.uk',
    replyTo: parsed.data.email,
    subject: `Website contact from ${parsed.data.name}`,
    text: `${parsed.data.message}\n\n— ${parsed.data.name} <${parsed.data.email}>`,
  })
  if (error) return { ok: false, message: 'Sending failed — email committee@telfordcanoeclub.co.uk directly.' }
  return { ok: true, message: 'The committee will come back to you as soon as they can.' }
}
