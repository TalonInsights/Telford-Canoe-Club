'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requireRole } from '@/lib/auth/guards'
import { MINUTE_BLOCK_TYPES } from '@/lib/minutes/blocks'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/lib/actions/auth'

/**
 * Editing the club's own words. A save writes the draft; publishing copies the
 * draft over the live copy. Nothing a committee member types becomes markup,
 * because blocks are data and are rendered as elements.
 */

const blockSchema = z.object({
  type: z.enum(MINUTE_BLOCK_TYPES),
  text: z.string().max(5000),
})

const contentSchema = z.object({
  key: z.string().trim().min(3).max(60),
  body: z.array(blockSchema).max(60),
})

export type ContentInput = z.infer<typeof contentSchema>

/** Which pages a slot appears on, so a publish refreshes the right ones. */
const affectedPaths: Record<string, string[]> = {
  'about.intro': ['/about'],
  'river.guidance': ['/venue/river-levels'],
  'home.notice': ['/'],
}

function revalidateFor(key: string) {
  for (const path of affectedPaths[key] ?? []) revalidatePath(path)
  revalidatePath('/admin/content')
}

export async function saveDraftAction(input: ContentInput): Promise<ActionResult> {
  const session = await requireRole('committee')
  const parsed = contentSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Check the text' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('content_blocks')
    .update({ draft_body: parsed.data.body, updated_by: session.userId })
    .eq('key', parsed.data.key)
  if (error) return { ok: false, message: error.message }

  revalidateFor(parsed.data.key)
  return { ok: true, message: 'Draft saved. Nothing has changed on the site yet.' }
}

export async function publishContentAction(input: ContentInput): Promise<ActionResult> {
  const session = await requireRole('committee')
  const parsed = contentSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Check the text' }
  }

  const supabase = await createClient()
  const { data: before } = await supabase
    .from('content_blocks')
    .select('body')
    .eq('key', parsed.data.key)
    .maybeSingle()

  const { error } = await supabase
    .from('content_blocks')
    .update({
      body: parsed.data.body,
      draft_body: null,
      published_at: new Date().toISOString(),
      updated_by: session.userId,
    })
    .eq('key', parsed.data.key)
  if (error) return { ok: false, message: error.message }

  await supabase.rpc('audit', {
    p_action: 'content.published',
    p_entity: 'content_blocks',
    p_before: before ? { body: before.body } : undefined,
    p_after: { key: parsed.data.key, blocks: parsed.data.body.length },
  })

  revalidateFor(parsed.data.key)
  return { ok: true, message: 'Published. This is live on the site now.' }
}

export async function discardDraftAction(key: string): Promise<ActionResult> {
  await requireRole('committee')
  if (typeof key !== 'string' || key.length < 3) return { ok: false, message: 'Unknown block' }

  const supabase = await createClient()
  const { error } = await supabase.from('content_blocks').update({ draft_body: null }).eq('key', key)
  if (error) return { ok: false, message: error.message }

  revalidateFor(key)
  return { ok: true, message: 'Draft thrown away, the live words are unchanged' }
}
