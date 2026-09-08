import { isSupabaseConfigured } from '@/lib/supabase/configured'
import { createClient } from '@/lib/supabase/server'
import type { Tables } from '@/lib/queries/helpers'

export type CommitteeRoleRow = Tables<'committee_roles'>

/** The columns the public page and the admin editor draw. */
export type CommitteeRoleSummary = Pick<
  CommitteeRoleRow,
  | 'id'
  | 'role_title'
  | 'holder_display_name'
  | 'sort_order'
  | 'description'
  | 'contact_email'
  | 'photo_path'
>

/** The real 2026 committee (from April, officers added 8 Sep), mirrored from supabase/seed.sql. */
const seedRoster: CommitteeRoleSummary[] = [
  { id: 's1', role_title: 'Chairman', holder_display_name: 'Simon Wiles', sort_order: 1, description: 'Leads the committee and represents the club.', contact_email: null, photo_path: null },
  { id: 's2', role_title: 'Treasurer', holder_display_name: 'Josh Smyth', sort_order: 2, description: 'Club finances and membership payments.', contact_email: null, photo_path: null },
  { id: 's3', role_title: 'Secretary', holder_display_name: 'Bek Farley-Brown', sort_order: 3, description: 'Minutes, correspondence and club records.', contact_email: null, photo_path: null },
  { id: 's4', role_title: 'Membership secretary', holder_display_name: 'Susanna Smyth', sort_order: 4, description: 'The member register, renewals and Paddle UK affiliation.', contact_email: null, photo_path: null },
  { id: 's5', role_title: 'Safety officer', holder_display_name: 'Simon Wiles', sort_order: 5, description: 'Safety on and off the water: risk assessments, safety guidance and incident reporting.', contact_email: null, photo_path: null },
  { id: 's6', role_title: 'Welfare officer', holder_display_name: 'Simon Wiles', sort_order: 6, description: 'Safeguarding and welfare for members of all ages, and the first point of contact for any concern.', contact_email: null, photo_path: null },
  { id: 's7', role_title: 'Committee member', holder_display_name: 'David Allen', sort_order: 7, description: 'General committee duties and site management.', contact_email: null, photo_path: null },
  { id: 's8', role_title: 'Freestyle champion', holder_display_name: 'Simon Wyndham', sort_order: 8, description: "Freestyle coaching, workshops and the club's freestyle programme.", contact_email: null, photo_path: null },
]

export async function getCommitteeRoles(): Promise<CommitteeRoleSummary[]> {
  if (!isSupabaseConfigured()) return seedRoster
  const supabase = await createClient()
  const { data } = await supabase
    .from('committee_roles')
    .select('id, role_title, holder_display_name, sort_order, description, contact_email, photo_path')
    .order('sort_order', { ascending: true })
  return data && data.length > 0 ? data : seedRoster
}
