import { isSupabaseConfigured } from '@/lib/supabase/configured'
import { createClient } from '@/lib/supabase/server'
import type { Tables } from '@/lib/queries/helpers'

export type CommitteeRoleRow = Tables<'committee_roles'>

/** The real 2026 committee (from April), mirrored from supabase/seed.sql. */
const seedRoster: Pick<
  CommitteeRoleRow,
  'id' | 'role_title' | 'holder_display_name' | 'sort_order' | 'description' | 'contact_email'
>[] = [
  { id: 's1', role_title: 'Chairman', holder_display_name: 'Simon Wiles', sort_order: 1, description: 'Leads the committee and represents the club.', contact_email: null },
  { id: 's2', role_title: 'Treasurer', holder_display_name: 'Josh Smyth', sort_order: 2, description: 'Club finances and membership payments.', contact_email: null },
  { id: 's3', role_title: 'Secretary', holder_display_name: 'Bek Farley-Brown', sort_order: 3, description: 'Minutes, correspondence and club records.', contact_email: null },
  { id: 's4', role_title: 'Membership secretary', holder_display_name: 'Susanna Smyth', sort_order: 4, description: 'The member register, renewals and Paddle UK affiliation.', contact_email: null },
  { id: 's5', role_title: 'Committee member', holder_display_name: 'David Allen', sort_order: 5, description: 'General committee duties and site management.', contact_email: null },
  { id: 's6', role_title: 'Freestyle champion', holder_display_name: 'Simon Wyndham', sort_order: 6, description: "Freestyle coaching, workshops and the club's freestyle programme.", contact_email: null },
]

export async function getCommitteeRoles() {
  if (!isSupabaseConfigured()) return seedRoster
  const supabase = await createClient()
  const { data } = await supabase
    .from('committee_roles')
    .select('id, role_title, holder_display_name, sort_order, description, contact_email')
    .order('sort_order', { ascending: true })
  return data && data.length > 0 ? data : seedRoster
}
