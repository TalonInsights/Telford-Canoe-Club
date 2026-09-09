import type { Metadata } from 'next'
import Link from 'next/link'
import { CalendarDays, ClipboardList, FileText, IdCard, Megaphone, ShoppingBag, Users } from 'lucide-react'

import { requireCurrentMember } from '@/lib/auth/guards'
import { formatDateTimeRange } from '@/lib/format'
import { getUpcomingEvents } from '@/lib/queries/events'
import { getMemberNotices, getMyBookings, getMyMemberships } from '@/lib/queries/members'
import { getPublishedMinutes } from '@/lib/queries/minutes'
import { getClubSettings } from '@/lib/queries/settings'
import { getUpcomingCheckins } from '@/lib/queries/checkins'
import { getMyOrders } from '@/lib/queries/merch'
import { merchMemberStatusLabel } from '@/lib/merch/labels'
import { formatDate } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = { title: 'Members' }

function Card({ title, icon: Icon, href, children }: { title: string; icon: React.ComponentType<{ className?: string }>; href: string; children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-stone bg-card p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lg">
          <Icon className="size-4 text-river" aria-hidden="true" />
          {title}
        </h2>
        <Button asChild variant="ghost" size="sm">
          <Link href={href}>Open</Link>
        </Button>
      </div>
      <div className="mt-3 grow text-sm text-ink-muted">{children}</div>
    </div>
  )
}

export default async function MembersDashboard() {
  // The guard and the data run together — the auth lookup is shared per request.
  const [, memberships, bookings, notices, events, minutes, orders] = await Promise.all([
    requireCurrentMember(),
    getMyMemberships(),
    getMyBookings(),
    getMemberNotices(),
    getUpcomingEvents(3),
    getPublishedMinutes(),
    getMyOrders(),
  ])
  const settings = await getClubSettings()
  const checkins = settings.checkinsEnabled ? await getUpcomingCheckins() : []
  const active = memberships.find((m) => m.status === 'active')

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card title="Membership" icon={IdCard} href="/members/membership">
        {active ? (
          <p>
            <Badge variant="success">Active</Badge>
            <span className="mt-2 block">
              {active.tier === 'family' ? 'Family' : active.tier === 'junior' ? 'Junior' : 'Adult'}{' '}
              membership · {active.periodLabel}
            </span>
          </p>
        ) : (
          <p>Your membership details and history.</p>
        )}
      </Card>
      <Card title="Next sessions" icon={CalendarDays} href="/members/events">
        {events.length === 0 ? (
          <p>Nothing scheduled right now.</p>
        ) : (
          <ul className="space-y-1.5">
            {events.map((e) => (
              <li key={e.id}>
                <Link href={`/events/${e.slug}`} className="font-medium text-ink underline-offset-4 hover:underline">
                  {e.title}
                </Link>
                <span className="block text-micro">{formatDateTimeRange(e.starts_at, e.ends_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card title="Notices" icon={Megaphone} href="/members/notices">
        {notices.length === 0 ? (
          <p>No notices at the moment.</p>
        ) : (
          <ul className="space-y-1.5">
            {notices.slice(0, 3).map((n) => (
              <li key={n.id} className="font-medium text-ink">
                {n.title}
              </li>
            ))}
          </ul>
        )}
      </Card>
      {settings.checkinsEnabled && (
        <Card title="Who is on site" icon={Users} href="/members/on-site">
          {checkins.length > 0 ? (
            <p>
              {checkins.length === 1
                ? 'One member has said they will be down'
                : `${checkins.length} members have said they will be down`}{' '}
              in the next week.
            </p>
          ) : (
            <p>Say when you will be at Jackfield, and see who else is planning to be there.</p>
          )}
        </Card>
      )}
      <Card title="Meeting minutes" icon={ClipboardList} href="/members/minutes">
        {minutes.length > 0 ? (
          <p>
            Latest:{' '}
            <span className="font-medium text-ink">{minutes[0].title}</span>,{' '}
            {formatDate(minutes[0].meeting_date)}. {minutes.length} published in all.
          </p>
        ) : (
          <p>The committee publishes minutes here after each meeting.</p>
        )}
      </Card>
      <Card title="Club shop" icon={ShoppingBag} href="/members/shop">
        {orders.length > 0 ? (
          <p>
            Your last order:{' '}
            <span className="font-medium text-ink">
              {merchMemberStatusLabel(orders[0].status).toLowerCase()}
            </span>
            , placed {formatDate(orders[0].created_at)}.
          </p>
        ) : (
          <p>Club beanies and hoodies, ordered here and handed over at the club.</p>
        )}
      </Card>
      <Card title="Documents" icon={FileText} href="/members/documents">
        <p>
          Members-only files land here as the committee uploads them, policies live on the{' '}
          <Link href="/about/policies" className="font-medium text-river underline-offset-4 hover:underline">
            public policies page
          </Link>
          .
        </p>
      </Card>
      {bookings.length > 0 && (
        <div className="sm:col-span-2">
          <Card title="My bookings" icon={CalendarDays} href="/members/events">
            <ul className="space-y-1.5">
              {bookings.slice(0, 4).map((b) => (
                <li key={b.id}>
                  <span className="font-medium text-ink">{b.event?.title ?? 'Event'}</span>{' '}
                  <Badge variant={b.status === 'booked' ? 'success' : 'outline'} className="ml-1">
                    {b.status === 'booked' ? 'Booked' : b.status === 'waitlist' ? 'Waitlist' : b.status}
                  </Badge>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </div>
  )
}
