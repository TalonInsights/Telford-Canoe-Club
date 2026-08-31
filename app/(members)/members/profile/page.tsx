import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { getSession } from '@/lib/auth/guards'
import { ProfileForm } from '@/components/members/profile-form'

export const metadata: Metadata = { title: 'My profile' }

export default async function ProfilePage() {
  const session = await getSession()
  if (!session) redirect('/login')
  const p = session.profile
  return (
    <div className="max-w-xl">
      <ProfileForm
        initial={{
          phone: p.phone ?? '',
          addressLine1: p.address_line1 ?? '',
          addressLine2: p.address_line2 ?? '',
          town: p.town ?? '',
          postcode: p.postcode ?? '',
          bcNumber: p.bc_membership_number ?? '',
          emergencyContactName: p.emergency_contact_name ?? '',
          emergencyContactPhone: p.emergency_contact_phone ?? '',
          emailOptIn: p.email_opt_in,
        }}
        name={`${p.first_name} ${p.last_name}`.trim()}
        email={session.email}
      />
    </div>
  )
}
