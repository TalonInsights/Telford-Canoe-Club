import { isSupabaseConfigured } from '@/lib/supabase/configured'
import { createClient } from '@/lib/supabase/server'

export type PlaceCategory = 'artificial' | 'natural'
export type PlaceLink = { label: string; url: string }

export type PaddlePlace = {
  id: string
  name: string
  category: PlaceCategory
  description: string
  photoPath: string | null
  links: PlaceLink[]
  sortOrder: number
  isPublished: boolean
}

function toLinks(raw: unknown): PlaceLink[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter(
      (l): l is PlaceLink =>
        !!l && typeof (l as PlaceLink).label === 'string' && typeof (l as PlaceLink).url === 'string'
    )
    .map((l) => ({ label: l.label, url: l.url }))
}

function toPlace(r: {
  id: string
  name: string
  category: string
  description: string
  photo_path: string | null
  links: unknown
  sort_order: number
  is_published: boolean
}): PaddlePlace {
  return {
    id: r.id,
    name: r.name,
    category: r.category === 'natural' ? 'natural' : 'artificial',
    description: r.description,
    photoPath: r.photo_path,
    links: toLinks(r.links),
    sortOrder: r.sort_order,
    isPublished: r.is_published,
  }
}

const COLUMNS = 'id, name, category, description, photo_path, links, sort_order, is_published'

export async function getPublishedPlaces(): Promise<PaddlePlace[]> {
  if (!isSupabaseConfigured()) return []
  const supabase = await createClient()
  const { data } = await supabase
    .from('paddle_places')
    .select(COLUMNS)
    .eq('is_published', true)
    .order('sort_order')
    .order('created_at')
  return (data ?? []).map(toPlace)
}

export async function getAllPlaces(): Promise<PaddlePlace[]> {
  if (!isSupabaseConfigured()) return []
  const supabase = await createClient()
  const { data } = await supabase
    .from('paddle_places')
    .select(COLUMNS)
    .order('sort_order')
    .order('created_at')
  return (data ?? []).map(toPlace)
}
