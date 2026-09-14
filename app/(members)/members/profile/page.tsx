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
    <div className="max-w-2xl">
      <h1 className="text-2xl">My details</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Keeping this right matters more than it looks: it is what the club uses to reach you, and
        who it calls if something happens on the water.
      </p>
      <div className="mt-6">
        <ProfileForm
          email={session.email}
          dobOnFile={Boolean(p.date_of_birth)}
          initial={{
            firstName: p.first_name ?? '',
            lastName: p.last_name ?? '',
            dateOfBirth: p.date_of_birth ?? '',
            phone: p.phone ?? '',
            addressLine1: p.address_line1 ?? '',
            addressLine2: p.address_line2 ?? '',
            town: p.town ?? '',
            postcode: p.postcode ?? '',
            bcNumber: p.bc_membership_number ?? '',
            emergencyContactName: p.emergency_contact_name ?? '',
            emergencyContactPhone: p.emergency_contact_phone ?? '',
            guardianName: p.guardian_name ?? '',
            guardianPhone: p.guardian_phone ?? '',
            emailOptIn: p.email_opt_in,
          }}
        />
      </div>
    </div>
  )
}
