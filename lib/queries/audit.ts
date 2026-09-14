import { isSupabaseConfigured } from '@/lib/supabase/configured'
import { createClient } from '@/lib/supabase/server'
import { auditCategories, type AuditCategory } from '@/lib/audit/vocabulary'
import { formatDate } from '@/lib/format'

/**
 * Reading the audit log.
 *
 * The structural filters — what kind of action, how far back, which person —
 * run in the database, so a search covers the whole log rather than whatever
 * happened to be on screen. Free-text search is left to the client over the
 * rows it has, because it matches a rendered sentence rather than a column.
 */

export type AuditEntry = {
  id: string
  created_at: string
  action: string
  entity: string
  entity_id: string | null
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
  actorId: string | null
  actorName: string | null
}

/** Action prefixes belonging to each category, for the database filter. */
const prefixesByCategory: Record<AuditCategory, string[]> = {
  members: ['profile', 'committee'],
  memberships: ['membership', 'membership_type', 'payment'],
  events: ['booking', 'event', 'checkin'],
  shop: ['merch'],
  email: ['email'],
  content: ['content', 'minutes', 'document', 'river_band'],
  settings: ['settings'],
}

export type AuditFilter = {
  category?: AuditCategory
  days?: number
  personId?: string
  limit?: number
}

export function isAuditCategory(v: string | undefined): v is AuditCategory {
  return !!v && (auditCategories as readonly string[]).includes(v)
}

/**
 * The clock is read here rather than in the page, both because the day filter
 * needs it anyway and because reading it during a component's render is
 * impure — the day headings have to be decided once, on the server, or the
 * browser can disagree about what "Today" means across midnight.
 */
export async function getAuditEntries(
  filter: AuditFilter = {}
): Promise<{ entries: AuditEntry[]; total: number; today: string; yesterday: string }> {
  const now = Date.now()
  const today = formatDate(new Date(now))
  const yesterday = formatDate(new Date(now - 86_400_000))
  if (!isSupabaseConfigured()) return { entries: [], total: 0, today, yesterday }
  const limit = filter.limit ?? 100
  const supabase = await createClient()

  let query = supabase
    .from('audit_log')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (filter.category) {
    const prefixes = prefixesByCategory[filter.category]
    query = query.or(prefixes.map((p) => `action.like.${p}.%`).join(','))
  }
  if (filter.days) {
    const since = new Date(now - filter.days * 86_400_000).toISOString()
    query = query.gte('created_at', since)
  }
  if (filter.personId) {
    // Things done TO them and things done BY them both count as theirs.
    query = query.or(`entity_id.eq.${filter.personId},actor_user_id.eq.${filter.personId}`)
  }

  const { data, count } = await query
  const rows = data ?? []

  const actorIds = [...new Set(rows.map((r) => r.actor_user_id).filter(Boolean))] as string[]
  const names = new Map<string, string>()
  if (actorIds.length > 0) {
    const { data: people } = await supabase
      .from('profiles')
      .select('user_id, first_name, last_name')
      .in('user_id', actorIds)
    for (const p of people ?? []) {
      const full = `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim()
      if (full) names.set(p.user_id, full)
    }
  }

  return {
    today,
    yesterday,
    total: count ?? rows.length,
    entries: rows.map((r) => ({
      id: r.id,
      created_at: r.created_at,
      action: r.action,
      entity: r.entity,
      entity_id: r.entity_id,
      before: (r.before as Record<string, unknown> | null) ?? null,
      after: (r.after as Record<string, unknown> | null) ?? null,
      actorId: r.actor_user_id,
      actorName: r.actor_user_id ? (names.get(r.actor_user_id) ?? null) : null,
    })),
  }
}

/** The name shown when a filter is pinned to one person. */
export async function getPersonName(userId: string): Promise<string | null> {
  if (!isSupabaseConfigured()) return null
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('first_name, last_name')
    .eq('user_id', userId)
    .maybeSingle()
  if (!data) return null
  return `${data.first_name ?? ''} ${data.last_name ?? ''}`.trim() || null
}
