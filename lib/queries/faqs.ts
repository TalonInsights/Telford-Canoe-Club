import { isSupabaseConfigured } from '@/lib/supabase/configured'
import { createClient } from '@/lib/supabase/server'

export type Faq = {
  id: string
  question: string
  answer: string
  sortOrder: number
  isPublished: boolean
}

function toFaq(r: {
  id: string
  question: string
  answer: string
  sort_order: number
  is_published: boolean
}): Faq {
  return {
    id: r.id,
    question: r.question,
    answer: r.answer,
    sortOrder: r.sort_order,
    isPublished: r.is_published,
  }
}

/** Published FAQs for the public contact page, in the club's order. */
export async function getPublishedFaqs(): Promise<Faq[]> {
  if (!isSupabaseConfigured()) return []
  const supabase = await createClient()
  const { data } = await supabase
    .from('faqs')
    .select('id, question, answer, sort_order, is_published')
    .eq('is_published', true)
    .order('sort_order')
    .order('created_at')
  return (data ?? []).map(toFaq)
}

/** Every FAQ, for the committee screen (RLS lets the committee see drafts). */
export async function getAllFaqs(): Promise<Faq[]> {
  if (!isSupabaseConfigured()) return []
  const supabase = await createClient()
  const { data } = await supabase
    .from('faqs')
    .select('id, question, answer, sort_order, is_published')
    .order('sort_order')
    .order('created_at')
  return (data ?? []).map(toFaq)
}
