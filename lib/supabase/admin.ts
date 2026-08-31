import 'server-only'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/types/database'

/**
 * Service-role client. §0 rule 10: this key NEVER reaches the client bundle —
 * the `server-only` import makes any client-side import a build error.
 * Use only in webhooks, cron routes and the importer; everything user-facing
 * goes through the RLS-bound clients.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
