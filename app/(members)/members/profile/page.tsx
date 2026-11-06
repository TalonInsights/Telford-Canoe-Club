import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { getSession } from '@/lib/auth/guards'
import { formatDate } from '@/lib/format'
import { getMyMemberships } from '@/lib/queries/members'
import { AddFamilyMember } from '@/components/members/add-family-member'
import { ProfileForm } from '@/components/members/profile-form'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = { title: 'My profile' }

export default async function ProfilePage() {
  const [session, memberships] = await Promise.all([getSession(), getMyMemberships()])
  if (!session) redirect('/login')
  const p = session.profile

  // The family membership the member can manage from here: the active one if
  // there is one, otherwise the most recent family membership they hold.
  const family =
    memberships.find((m) => m.tier === 'family' && m.status === 'active') ??
    memberships.find((m) => m.tier === 'family')

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
          identity={{
            name: `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim(),
            dateOfBirth: p.date_of_birth ? formatDate(p.date_of_birth) : '',
          }}
          initial={{
            phone: p.phone ?? '',
            addressLine1: p.address_line1 ?? '',
            addressLine2: p.address_line2 ?? '',
            town: p.town ?? '',
            postcode: p.postcode ?? '',
            bcNumber: p.bc_membership_number ?? '',
            carRegistration: p.car_registration ?? '',
            emergencyContactName: p.emergency_contact_name ?? '',
            emergencyContactPhone: p.emergency_contact_phone ?? '',
            guardianName: p.guardian_name ?? '',
            guardianPhone: p.guardian_phone ?? '',
            emailOptIn: p.email_opt_in,
          }}
        />
      </div>

      {family && (
        <section className="mt-10 rounded-xl border border-stone bg-card p-5">
          <h2 className="text-lg">Family on your membership</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Everyone your {family.periodLabel} family membership covers. You can add a child or
            other family member here at any time, or from{' '}
            <Link href="/members/membership" className="underline underline-offset-2">
              my membership
            </Link>
            .
          </p>
          {family.covered.length > 0 ? (
            <ul className="mt-3 grid gap-2">
              {family.covered.map((c, i) => (
                <li
                  key={i}
                  className="flex flex-wrap items-center gap-2 rounded-lg border border-stone bg-foam px-3 py-2 text-sm"
                >
                  <span className="font-medium text-ink">{c.display_name}</span>
                  {c.is_junior && <Badge variant="outline">Junior</Badge>}
                  {c.date_of_birth && (
                    <span className="text-micro text-ink-muted">b. {formatDate(c.date_of_birth)}</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-ink-muted">No family members are listed yet.</p>
          )}
          <AddFamilyMember membershipId={family.id} />
        </section>
      )}
    </div>
  )
}
