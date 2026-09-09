/**
 * The named groups an email can go to, and how they read on screen.
 *
 * Deliberately client-safe and free of any database import: the composer is a
 * client component and needs these labels, and pulling the server client in
 * behind them would drag `next/headers` into the browser bundle.
 */

export const emailSegments = ['paid_members', 'registered_unpaid', 'everyone'] as const

export type EmailSegment = (typeof emailSegments)[number]

export const segmentLabels: Record<EmailSegment, string> = {
  paid_members: 'Paid-up members',
  registered_unpaid: 'Registered, never paid',
  everyone: 'Everyone with an account',
}

export const segmentHints: Record<EmailSegment, string> = {
  paid_members: 'Anyone whose membership is active and has not run out, including family members.',
  registered_unpaid: 'People who made an account but have never held a membership.',
  everyone: 'Every account on the site.',
}
