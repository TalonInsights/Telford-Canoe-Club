import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { CancelMembershipButton } from '@/components/admin/cancel-membership'
import { ExtendMembershipButton, MarkRefundedButton } from '@/components/admin/membership-tools'
import { RecordPaymentButton } from '@/components/admin/record-payment'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { requireRole } from '@/lib/auth/guards'
import { formatDate, formatMoneyGBP } from '@/lib/format'
import { getMemberDetail } from '@/lib/queries/admin'

export const metadata: Metadata = { title: 'Member record' }

const tierLabel: Record<string, string> = { adult: 'Adult', junior: 'Junior', family: 'Family' }

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-wrap justify-between gap-2 border-b border-stone py-2 text-sm last:border-b-0">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="font-medium">{value || '—'}</dd>
    </div>
  )
}

export default async function MemberRecordPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole('committee')
  const { id } = await params
  const detail = await getMemberDetail(id)
  if (!detail) notFound()
  const { profile, memberships, bookings } = detail

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl">
            {profile.first_name} {profile.last_name}
          </h1>
          <p className="text-sm text-ink-muted">{profile.email}</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/members">Back to members</Link>
        </Button>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-stone bg-card p-5">
          <h2 className="text-lg">Profile</h2>
          <dl className="mt-3">
            <Row label="Phone" value={profile.phone} />
            <Row
              label="Address"
              value={[profile.address_line1, profile.address_line2, profile.town, profile.postcode]
                .filter(Boolean)
                .join(', ')}
            />
            <Row label="Date of birth" value={profile.date_of_birth ? formatDate(profile.date_of_birth) : null} />
            <Row label="Paddle UK number" value={profile.bc_membership_number} />
            <Row
              label="Emergency contact"
              value={[profile.emergency_contact_name, profile.emergency_contact_phone].filter(Boolean).join(' · ')}
            />
            <Row
              label="Parent or guardian"
              value={[profile.guardian_name, profile.guardian_phone].filter(Boolean).join(' · ')}
            />
            <Row label="Site role" value={profile.role} />
            <Row label="Club news emails" value={profile.email_opt_in ? 'Opted in' : 'Opted out'} />
          </dl>
        </section>

        <section className="rounded-xl border border-stone bg-card p-5">
          <h2 className="text-lg">Memberships</h2>
          {memberships.length === 0 ? (
            <p className="mt-3 text-sm text-ink-muted">
              No membership on record — they can request one from their account, or you can take
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
                    {m.covered.length > 1 && <> · covers {m.covered.join(', ')}</>}
                    {m.notes && <> · {m.notes}</>}
                  </p>
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
