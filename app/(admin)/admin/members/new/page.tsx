import type { Metadata } from 'next'

import { AddMembershipForm } from '@/components/admin/add-membership-form'
import { getMembershipTypes } from '@/lib/queries/membership-types'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Add a membership' }

export default async function AdminAddMembershipPage() {
  const supabase = await createClient()
  const [{ data: profiles }, { data: periods }, types] = await Promise.all([
    supabase
      .from('profiles')
      .select('user_id, first_name, last_name, email, role')
      .is('deactivated_at', null)
      .order('last_name', { ascending: true }),
    supabase
      .from('membership_periods')
      .select('id, label, is_current')
      .order('starts_on', { ascending: false }),
    getMembershipTypes(),
  ])

  return (
    <>
      <h1 className="text-2xl">Add a membership</h1>
      <p className="mt-1 max-w-[68ch] text-sm text-ink-muted">
        For walk-up cash payers and anyone the committee signs up directly. The person needs an
        account first: someone without one can register at the join page in about two minutes,
        then appears here. (Bulk imports from the old site come with the migration phase.)
      </p>
      <div className="mt-6">
        <AddMembershipForm
          people={(profiles ?? []).map((p) => ({
            userId: p.user_id,
            name: `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || p.email,
            email: p.email,
            role: p.role,
          }))}
          periods={(periods ?? []).map((p) => ({ id: p.id, label: p.label, isCurrent: p.is_current }))}
          types={types.map((t) => ({
            id: t.id,
            name: t.name,
            pricePence: t.pricePence,
            coversFamily: t.coversFamily,
          }))}
        />
      </div>
    </>
  )
}
