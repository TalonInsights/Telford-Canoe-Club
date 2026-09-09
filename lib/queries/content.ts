import { cache } from 'react'

import { parseBlocks, type MinuteBlock } from '@/lib/minutes/blocks'
import { isSupabaseConfigured } from '@/lib/supabase/configured'
import { createClient } from '@/lib/supabase/server'

/**
 * The editable slots on fixed pages. Reads are cached per request because a
 * page may render more than one, and the published columns are the only ones
 * a visitor's role is even granted (0027).
 */

export type ContentBlock = {
  key: string
  title: string
  location: string
  help: string | null
  body: MinuteBlock[]
  publishedAt: string | null
  sortOrder: number
}

export type EditableContentBlock = ContentBlock & { draft: MinuteBlock[] | null }

const PUBLIC_COLUMNS = 'key, title, location, help, body, published_at, sort_order'

/** What the site shows. Empty when the committee has not written anything. */
export const getContentBlock = cache(async (key: string): Promise<MinuteBlock[]> => {
  if (!isSupabaseConfigured()) return []
  const supabase = await createClient()
  const { data } = await supabase
    .from('content_blocks')
    .select('body, published_at')
    .eq('key', key)
    .maybeSingle()
  if (!data?.published_at) return []
  return parseBlocks(data.body)
})

/** The committee's list, drafts included. Committee only, by column grant. */
export async function getEditableBlocks(): Promise<EditableContentBlock[]> {
  if (!isSupabaseConfigured()) return []
  const supabase = await createClient()
  const { data } = await supabase
    .from('content_blocks')
    .select(`${PUBLIC_COLUMNS}, draft_body`)
    .order('sort_order', { ascending: true })

  return (data ?? []).map((row) => ({
    key: row.key,
    title: row.title,
    location: row.location,
    help: row.help,
    body: parseBlocks(row.body),
    draft: row.draft_body === null ? null : parseBlocks(row.draft_body),
    publishedAt: row.published_at,
    sortOrder: row.sort_order,
  }))
}

export async function getEditableBlock(key: string): Promise<EditableContentBlock | null> {
  const blocks = await getEditableBlocks()
  return blocks.find((b) => b.key === key) ?? null
}
