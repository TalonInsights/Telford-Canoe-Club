/**
 * Turning what the database records into what a committee member reads.
 *
 * The log stores keys like `membership.payment_recorded`. Rather than a
 * hand-written label for every one — a list that goes stale the first time
 * somebody adds a feature and forgets it — the prefix decides the category and
 * the rest is prettified automatically. Explicit entries exist only where the
 * automatic reading would be wrong or unclear, so an action nobody has
 * labelled still arrives as "Payment recorded", never as a raw key.
 *
 * Client-safe: no server imports, because the log screen is interactive.
 */

export const auditCategories = [
  'members',
  'memberships',
  'events',
  'shop',
  'email',
  'content',
  'settings',
] as const

export type AuditCategory = (typeof auditCategories)[number]

export const categoryLabels: Record<AuditCategory, string> = {
  members: 'Members and committee',
  memberships: 'Memberships and payments',
  events: 'Events and bookings',
  shop: 'Shop',
  email: 'Email',
  content: 'Notices, minutes and documents',
  settings: 'Club settings',
}

/** Which family of the site an action belongs to, by its prefix. */
const categoryByPrefix: Record<string, AuditCategory> = {
  profile: 'members',
  committee: 'members',
  membership: 'memberships',
  membership_type: 'memberships',
  payment: 'memberships',
  booking: 'events',
  event: 'events',
  checkin: 'events',
  merch: 'shop',
  email: 'email',
  content: 'content',
  minutes: 'content',
  document: 'content',
  river_band: 'content',
  settings: 'settings',
}

/** Only where prettifying the key would read badly or lose the meaning. */
const explicitLabels: Record<string, string> = {
  'profile.updated': 'Member updated their own record',
  'profile.updated_by_committee': 'Record edited by the committee',
  'profile.updated_by_system': 'Record changed by the system',
  'profile.role_changed': 'Site role changed',
  'membership.admin_created': 'Membership added by the committee',
  'membership.expiry_sweep': 'Yearly expiry sweep',
  'membership.paid_online': 'Membership paid online',
  'membership.payment_recorded': 'Membership payment recorded by hand',
  'email.campaign_sending': 'Club email sent',
  'email.unsubscribed': 'Unsubscribed from club news',
  'merch.paid_online': 'Shop order paid online',
  'merch.capture_declined': 'Shop payment declined',
  'payment.capture_declined': 'Payment declined',
  'booking.cancelled_by_club': 'Booking cancelled by the club',
  'committee.photo_updated': 'Committee photo added',
  'committee.photo_removed': 'Committee photo removed',
}

/**
 * Null for a prefix nobody has filed yet. Deliberately not a catch-all
 * category: filing an unknown action under "Club settings" would badge it as
 * something the Club settings filter then does not return, and a filter that
 * hides rows it claims to show is worse than no filter.
 */
export function auditCategory(action: string): AuditCategory | null {
  const prefix = action.split('.')[0] ?? ''
  return categoryByPrefix[prefix] ?? null
}

/** What to badge a row with, including one whose family is unknown. */
export function auditCategoryLabel(action: string): string {
  const category = auditCategory(action)
  if (category) return categoryLabels[category]
  const prefix = (action.split('.')[0] ?? '').replace(/_/g, ' ')
  return prefix ? prefix.charAt(0).toUpperCase() + prefix.slice(1) : 'Other'
}

export function auditLabel(action: string): string {
  const explicit = explicitLabels[action]
  if (explicit) return explicit
  const rest = action.split('.').slice(1).join(' ').replace(/_/g, ' ').trim()
  if (!rest) return action
  return rest.charAt(0).toUpperCase() + rest.slice(1)
}

/** Profile columns in the words the club uses for them. */
export const fieldLabels: Record<string, string> = {
  first_name: 'first name',
  last_name: 'last name',
  date_of_birth: 'date of birth',
  email_opt_in: 'club news preference',
  bc_membership_number: 'Paddle UK number',
  deactivated_at: 'account status',
  phone: 'phone',
  address_line1: 'address',
  address_line2: 'address',
  town: 'town',
  postcode: 'postcode',
  emergency_contact_name: 'emergency contact',
  emergency_contact_phone: 'emergency contact',
  guardian_name: 'parent or guardian',
  guardian_phone: 'parent or guardian',
  role: 'site role',
}

function readValue(v: unknown): string {
  if (v === null || v === undefined || v === '') return 'blank'
  if (typeof v === 'boolean') return v ? 'on' : 'off'
  return String(v)
}

/** Duplicates removed and order kept, so "address, address, town" reads once. */
function fieldList(fields: string[]): string[] {
  const out: string[] = []
  for (const f of fields) {
    const label = fieldLabels[f] ?? f.replace(/_/g, ' ')
    if (!out.includes(label)) out.push(label)
  }
  return out
}

function joinWords(parts: string[]): string {
  if (parts.length <= 1) return parts[0] ?? ''
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`
}

type Json = Record<string, unknown> | null

/**
 * One sentence saying what actually changed. Falls back to naming the keys
 * rather than printing raw JSON, so even an entry this function has never seen
 * stays readable.
 */
export function describeAudit(before: Json, after: Json): string {
  const b = before ?? {}
  const a = after ?? {}

  const rawFields = Array.isArray(a.fields) ? a.fields : Array.isArray(b.fields) ? b.fields : null
  if (rawFields) {
    const fields = rawFields.filter((f): f is string => typeof f === 'string')
    const named = fields
      .filter((f) => f in a || f in b)
      .map((f) => `${fieldLabels[f] ?? f}: ${readValue(b[f])} → ${readValue(a[f])}`)
    const rest = fieldList(fields.filter((f) => !(f in a) && !(f in b)))
    const parts = [...named]
    if (rest.length) parts.push(`${joinWords(rest)} changed`)
    return parts.join(' · ') || 'No change recorded'
  }

  // A before/after pair on the same key, e.g. the role change entry. Anything
  // recorded only on the after side — the reason a role was changed, say — is
  // kept too: it was written down deliberately and is the most useful part.
  const shared = Object.keys(a).filter((k) => k in b && a[k] !== b[k])
  if (shared.length) {
    const diffs = shared.map(
      (k) => `${fieldLabels[k] ?? k.replace(/_/g, ' ')}: ${readValue(b[k])} → ${readValue(a[k])}`
    )
    const extras = Object.keys(a)
      .filter((k) => !(k in b) && k !== 'name' && k !== 'fields')
      .map((k) => `${fieldLabels[k] ?? k.replace(/_/g, ' ')}: ${readValue(a[k])}`)
    return [...diffs, ...extras].join(' · ')
  }

  const keys = Object.keys(a).filter((k) => k !== 'name')
  if (keys.length === 0) return before ? 'Removed' : 'No detail recorded'
  return keys.map((k) => `${k.replace(/_/g, ' ')}: ${readValue(a[k])}`).join(' · ')
}

/** The person an entry is about, when the entry carries a name. */
export function auditSubjectName(after: Json, before: Json): string | null {
  for (const src of [after, before]) {
    const n = src?.name
    if (typeof n === 'string' && n.trim()) return n.trim()
  }
  return null
}
