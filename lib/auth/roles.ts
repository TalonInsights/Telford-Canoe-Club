import type { Enums } from '@/lib/queries/helpers'

/**
 * What each role is called, and what it actually lets someone do, in the words
 * the committee would use. Kept apart from `guards.ts` because that file
 * reaches for the server Supabase client, and the role picker is a client
 * component.
 */

export type AppRole = Enums<'app_role'>

export const appRoles = ['registered', 'member', 'committee', 'admin'] as const satisfies readonly AppRole[]

export const roleLabels: Record<AppRole, string> = {
  registered: 'Registered',
  member: 'Member',
  committee: 'Committee',
  admin: 'Admin',
}

export const roleHints: Record<AppRole, string> = {
  registered: 'Has an account. Sees nothing members-only until a membership is paid.',
  member: 'The ordinary member view: bookings, documents, the members area.',
  committee: 'Everything a member sees, plus the admin area: members, events, minutes, email.',
  admin: 'Everything the committee can do, plus settings, prices, the audit log and these roles.',
}
