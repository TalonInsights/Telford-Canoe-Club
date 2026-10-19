'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requireRole } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/lib/actions/auth'

/**
 * The committee's FAQ. Admin-gated here and by RLS. Reordering is done by
 * sending the whole ordered list of ids, so one save settles the order rather
 * than a run of swaps that can race.
 */

const faqSchema = z.object({
  id: z.uuid().optional(),
  question: z.string().trim().min(5, 'Write the question').max(300),
  answer: z.string().trim().min(2, 'Write the answer').max(4000),
  isPublished: z.boolean(),
})

export type FaqInput = z.input<typeof faqSchema>

function revalidateFaqs() {
  revalidatePath('/admin/faq')
  revalidatePath('/contact')
}

export async function saveFaqAction(input: FaqInput): Promise<ActionResult> {
  await requireRole('committee')
  const parsed = faqSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? 'Check the form' }
  const v = parsed.data
  const supabase = await createClient()

  if (v.id) {
    const { error } = await supabase
      .from('faqs')
      .update({ question: v.question, answer: v.answer, is_published: v.isPublished })
      .eq('id', v.id)
    if (error) return { ok: false, message: error.message }
    await supabase.rpc('audit', {
      p_action: 'faq.updated',
      p_entity: 'faqs',
      p_entity_id: v.id,
      p_after: { question: v.question, is_published: v.isPublished },
    })
    revalidateFaqs()
    return { ok: true, message: 'Question saved' }
  }

  // New questions go to the end of the list.
  const { data: last } = await supabase
    .from('faqs')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()
  const sortOrder = (last?.sort_order ?? 0) + 1

  const { data, error } = await supabase
    .from('faqs')
    .insert({ question: v.question, answer: v.answer, is_published: v.isPublished, sort_order: sortOrder })
    .select('id')
    .single()
  if (error) return { ok: false, message: error.message }
  await supabase.rpc('audit', {
    p_action: 'faq.created',
    p_entity: 'faqs',
    p_entity_id: data.id,
    p_after: { question: v.question },
  })
  revalidateFaqs()
  return { ok: true, message: 'Question added' }
}

export async function deleteFaqAction(id: string): Promise<ActionResult> {
  await requireRole('committee')
  if (!z.uuid().safeParse(id).success) return { ok: false, message: 'Unknown question' }
  const supabase = await createClient()
  const { data: before } = await supabase.from('faqs').select('question').eq('id', id).maybeSingle()
  if (!before) return { ok: false, message: 'Not found' }
  const { error } = await supabase.from('faqs').delete().eq('id', id)
  if (error) return { ok: false, message: error.message }
  await supabase.rpc('audit', {
    p_action: 'faq.deleted',
    p_entity: 'faqs',
    p_entity_id: id,
    p_before: { question: before.question },
  })
  revalidateFaqs()
  return { ok: true, message: 'Question removed' }
}

/** Save the whole order at once from the reordering controls. */
export async function reorderFaqsAction(ids: string[]): Promise<ActionResult> {
  await requireRole('committee')
  const parsed = z.array(z.uuid()).max(200).safeParse(ids)
  if (!parsed.success) return { ok: false, message: 'Invalid order' }
  const supabase = await createClient()
  for (let i = 0; i < parsed.data.length; i++) {
    const { error } = await supabase.from('faqs').update({ sort_order: i + 1 }).eq('id', parsed.data[i])
    if (error) return { ok: false, message: error.message }
  }
  revalidateFaqs()
  return { ok: true, message: 'Order saved' }
}
