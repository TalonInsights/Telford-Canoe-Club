import { cache } from 'react'

import type { RiverBand } from '@/lib/river/bands'
import { isSupabaseConfigured } from '@/lib/supabase/configured'
import { createClient } from '@/lib/supabase/server'

/**
 * The committee's guidance ladder. Read on the home strip, the river levels
 * page and the admin editor, so it is cached per request like the settings.
 */
export const getRiverBands = cache(async (): Promise<RiverBand[]> => {
  if (!isSupabaseConfigured()) return []
  const supabase = await createClient()
  const { data } = await supabase
    .from('river_level_bands')
    .select('id, min_cm, max_cm, label, description, sort_order')
    .order('sort_order', { ascending: true })

  return (data ?? []).map((row) => ({
    id: row.id,
    minCm: row.min_cm,
    maxCm: row.max_cm,
    label: row.label,
    description: row.description,
    sortOrder: row.sort_order,
  }))
})
