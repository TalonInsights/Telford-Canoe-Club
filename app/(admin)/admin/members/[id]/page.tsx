import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { History } from 'lucide-react'

import { CancelMembershipButton } from '@/components/admin/cancel-membership'
import { MemberEditor } from '@/components/admin/member-editor'
import { ExtendMembershipButton, MarkRefundedButton } from '@/components/admin/membership-tools'
import { RecordPaymentButton } from '@/components/admin/record-payment'
import { RoleControl } from '@/components/admin/role-control'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { requireRole, roleAtLeast } from '@/lib/auth/guards'
import { roleLabels } from '@/lib/auth/roles'
import { formatDate, formatMoneyGBP } from '@/lib/format'
import { getMemberDetail } from '@/lib/queries/admin'

export const metadata: Metadata = { title: 'Member record' }

const tierLabel: Record<string, string> = { adult: 'Adult', junior: 'Junior', family: 'Family' }

export default async function MemberRecordPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole('committee')
  const { id } = await params
  const detail = await getMemberDetail(id)
  if (!detail) notFound()
  const { profile, memberships, bookings } = detail
  const canSetRoles = roleAtLeast(session.profile.role, 'admin')

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl">
            {profile.first_name} {profile.last_name}
          </h1>
          <p className="text-sm text-ink-muted">{profile.email}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canSetRoles && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/audit?person=${profile.user_id}`}>
                <History aria-hidden="true" /> Their change log
              </Link>
            </Button>
          )}
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/members">Back to members</Link>
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <MemberEditor
          userId={profile.user_id}
          email={profile.email}
          role={roleLabels[profile.role]}
          initial={{
            firstName: profile.first_name ?? '',
            lastName: profile.last_name ?? '',
            dateOfBirth: profile.date_of_birth ?? '',
            phone: profile.phone ?? '',
            addressLine1: profile.address_line1 ?? '',
            addressLine2: profile.address_line2 ?? '',
            town: profile.town ?? '',
            postcode: profile.postcode ?? '',
            bcNumber: profile.bc_membership_number ?? '',
            emergencyContactName: profile.emergency_contact_name ?? '',
            emergencyContactPhone: profile.emergency_contact_phone ?? '',
            guardianName: profile.guardian_name ?? '',
            guardianPhone: profile.guardian_phone ?? '',
            emailOptIn: profile.email_opt_in,
          }}
        />

        <section className="rounded-xl border border-stone bg-card p-5">
          <h2 className="text-lg">Memberships</h2>
          {memberships.length === 0 ? (
            <p className="mt-3 text-sm text-ink-muted">
              No membership on record, they can request one from their account, or you can take
              a payment and record it once the tier is requested.
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {memberships.map((m) => (
                <li key={m.id} className="rounded-lg border border-stone p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">
                      {tierLabel[m.tier]} · {m.periodLabel}
                    </span>
                    <Badge
                      variant={
                        m.status === 'active' ? 'success' : m.status === 'pending' ? 'signal' : 'outline'
                      }
                    >
                      {m.status.charAt(0).toUpperCase() + m.status.slice(1)}
                    </Badge>
                    <span className="ml-auto text-sm tabular-nums">{formatMoneyGBP(m.amount_pence)}</span>
                  </div>
                  <p className="mt-1 text-micro text-ink-muted">
                    {m.paid_at ? `Paid ${formatDate(m.paid_at)} · ${m.source.replace('manual_', '')}` : 'Not paid'}
                    {m.paypal_capture_id && <> · ref {m.paypal_capture_id}</>}
                    {m.notes && <> · {m.notes}</>}
                  </p>
                  {m.covered.length > 1 && (
                    <div className="mt-2">
                      <p className="text-micro font-medium text-ink-muted">Covers {m.covered.length} people</p>
                      <ul className="mt-1 grid gap-1.5">
                        {m.covered.map((c, i) => (
                          <li key={i} className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md bg-foam px-2.5 py-1.5 text-micro">
                            <span className="font-medium text-ink">{c.display_name}</span>
                            {c.is_junior && <Badge variant="outline">Junior</Badge>}
                            {c.date_of_birth && <span className="text-ink-muted">b. {formatDate(c.date_of_birth)}</span>}
                            {(c.emergency_contact_name || c.emergency_contact_phone) && (
                              <span className="text-ink-muted">
                                · emergency: {[c.emergency_contact_name, c.emergency_contact_phone].filter(Boolean).join(' · ')}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {m.status === 'pending' && (
                      <RecordPaymentButton
                        membershipId={m.id}
                        memberName={`${profile.first_name} ${profile.last_name}`}
                        amountPence={m.amount_pence}
                      />
                    )}
                    {m.status === 'active' && (
                      <ExtendMembershipButton
                        membershipId={m.id}
                        memberName={`${profile.first_name} ${profile.last_name}`}
                      />
                    )}
                    {(m.status === 'pending' || m.status === 'active') && (
                      <CancelMembershipButton
                        membershipId={m.id}
                        memberName={`${profile.first_name} ${profile.last_name}`}
                      />
                    )}
                    {m.status === 'active' && m.paid_at && m.amount_pence > 0 && (
                      <MarkRefundedButton
                        membershipId={m.id}
                        memberName={`${profile.first_name} ${profile.last_name}`}
                      />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {canSetRoles && (
          <RoleControl
            userId={profile.user_id}
            memberName={`${profile.first_name} ${profile.last_name}`.trim()}
            currentRole={profile.role}
            isSelf={profile.user_id === session.userId}
          />
        )}

        <section className="rounded-xl border border-stone bg-card p-5 lg:col-span-2">
          <h2 className="text-lg">Recent bookings</h2>
          {bookings.length === 0 ? (
            <p className="mt-3 text-sm text-ink-muted">No bookings yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-stone">
              {bookings.map((b) => (
                <li key={b.id} className="flex flex-wrap items-center gap-2 py-2 text-sm">
                  <span className="font-medium">{b.eventTitle ?? 'Event'}</span>
                  <Badge variant={b.status === 'booked' ? 'success' : 'outline'}>{b.status}</Badge>
                  <span className="ml-auto text-micro text-ink-muted">{formatDate(b.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  )
}
