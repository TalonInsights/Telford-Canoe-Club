/**
 * The whole site renders before the anon key is pasted: every query falls
 * back to seed content when Supabase isn't configured, and auth actions
 * explain themselves instead of crashing. The moment NEXT_PUBLIC_SUPABASE_URL
 * and NEXT_PUBLIC_SUPABASE_ANON_KEY exist (locally and on Vercel), the same
 * code serves live data with no further changes.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

export const NOT_CONFIGURED_MESSAGE =
  'The membership system is being connected — this will work very soon. ' +
  'In the meantime, email committee@telfordcanoeclub.co.uk.'
