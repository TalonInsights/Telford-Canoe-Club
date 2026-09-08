import { isSupabaseConfigured } from '@/lib/supabase/configured'
import { createClient } from '@/lib/supabase/server'
import { parseBlocks, type MinuteBlock } from '@/lib/minutes/blocks'
import type { Tables } from '@/lib/queries/helpers'

export type MinutesRow = Tables<'meeting_minutes'>

export type Minutes = Omit<MinutesRow, 'body'> & { body: MinuteBlock[] }

function hydrate(row: MinutesRow): Minutes {
  return { ...row, body: parseBlocks(row.body) }
}

/**
 * Published minutes, newest meeting first. RLS decides what comes back: a
 * current member sees published sets, the committee also sees its drafts
 * through the admin query below.
 */
export async function getPublishedMinutes(): Promise<Minutes[]> {
  if (!isSupabaseConfigured()) return []
  const supabase = await createClient()
  const { data } = await supabase
    .from('meeting_minutes')
    .select('*')
    .eq('status', 'published')
    .order('meeting_date', { ascending: false })
  return (data ?? []).map(hydrate)
}

/** Everything, drafts included. Committee only, enforced by RLS. */
export async function getAllMinutes(): Promise<Minutes[]> {
  if (!isSupabaseConfigured()) return []
  const supabase = await createClient()
  const { data } = await supabase
    .from('meeting_minutes')
    .select('*')
    .order('meeting_date', { ascending: false })
  return (data ?? []).map(hydrate)
}

export async function getMinutesById(id: string): Promise<Minutes | null> {
  if (!isSupabaseConfigured()) return null
  const supabase = await createClient()
  const { data } = await supabase.from('meeting_minutes').select('*').eq('id', id).maybeSingle()
  return data ? hydrate(data) : null
}
