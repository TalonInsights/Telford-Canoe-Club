'use client'

/**
 * P0-13 — month-grid structure referenced from 21st.dev "Event Calendar"
 * (https://21st.dev/@ruixen.ui/components/event-calendar, MIT; heatmap
 * variants rejected — wrong semantics). Rebuilt with date-fns for TCC:
 * event chips are a coloured dot + text (never colour alone), month
 * navigation is keyboard-operable buttons, and below `sm` the grid is
 * replaced by a chronological list — §3.5 forbids hiding comparisons, but a
 * 7-column grid at 375px hides everything, so the list IS the mobile view.
 */

import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { enGB } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { formatDateTimeRange } from '@/lib/format'
import { cn } from '@/lib/utils'
import { CalendarDays } from 'lucide-react'

export type CalendarEvent = {
  id: string
  slug: string
  title: string
  category: string
  startsAt: string | Date
}

/* §3.2: category identity uses the chart tones; the word always accompanies the dot. */
const categoryDot: Record<string, string> = {
  club_night: 'bg-river',
  trip: 'bg-deep',
  freestyle: 'bg-signal',
  slalom: 'bg-warn',
  pool: 'bg-success',
  social: 'bg-river',
  course: 'bg-deep',
  other: 'bg-stone',
}

function EventChip({ event }: { event: CalendarEvent }) {
  return (
    <Link
      href={`/events/${event.slug}`}
      className="flex min-w-0 items-center gap-1.5 rounded-md px-1.5 py-1 text-micro leading-tight hover:bg-foam"
    >
      <span
        aria-hidden="true"
        className={cn('size-1.5 shrink-0 rounded-full', categoryDot[event.category] ?? 'bg-stone')}
      />
      <span className="truncate">{event.title}</span>
    </Link>
  )
}

export function EventCalendar({
  events,
  initialMonth,
}: {
  events: CalendarEvent[]
  initialMonth?: Date
}) {
  const [month, setMonth] = useState(() => startOfMonth(initialMonth ?? new Date()))

  const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 1 })
  const gridEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })

  const eventsOn = (day: Date) =>
    events.filter((e) => isSameDay(new Date(e.startsAt), day))

  const monthEvents = events
    .filter((e) => isSameMonth(new Date(e.startsAt), month))
    .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt))

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 aria-live="polite">{format(month, 'MMMM yyyy', { locale: enGB })}</h3>
        <div className="flex gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Previous month"
            onClick={() => setMonth((m) => addMonths(m, -1))}
          >
            <ChevronLeft />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Next month"
            onClick={() => setMonth((m) => addMonths(m, 1))}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>

      {/* Month grid — ≥sm only */}
      <div className="hidden overflow-hidden rounded-xl border border-stone bg-card sm:block">
        <div className="grid grid-cols-7 border-b border-stone bg-foam">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
            <div key={d} className="px-2 py-2 text-center text-micro font-medium text-ink-muted">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const dayEvents = eventsOn(day)
            const inMonth = isSameMonth(day, month)
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  'min-h-24 border-t border-r border-stone p-1.5 [&:nth-child(7n)]:border-r-0 [&:nth-child(-n+7)]:border-t-0',
                  !inMonth && 'bg-foam/60'
                )}
              >
                <p
                  className={cn(
                    'mb-1 flex size-6 items-center justify-center rounded-full text-micro tabular-nums',
                    isToday(day) && 'bg-deep font-medium text-white',
                    !inMonth && 'text-ink-muted'
                  )}
                >
                  {format(day, 'd')}
                </p>
                <div className="space-y-0.5">
                  {dayEvents.slice(0, 3).map((e) => (
                    <EventChip key={e.id} event={e} />
                  ))}
                  {dayEvents.length > 3 && (
                    <p className="px-1.5 text-micro text-ink-muted">+{dayEvents.length - 3} more</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Mobile list fallback — <sm */}
      <div className="sm:hidden">
        {monthEvents.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="Nothing this month"
            description="Try the next month, or check back soon."
          />
        ) : (
          <ul className="divide-y divide-stone rounded-xl border border-stone bg-card">
            {monthEvents.map((e) => (
              <li key={e.id}>
                <Link
                  href={`/events/${e.slug}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-foam"
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      'size-2 shrink-0 rounded-full',
                      categoryDot[e.category] ?? 'bg-stone'
                    )}
                  />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{e.title}</span>
                    <span className="block text-micro text-ink-muted">
                      {formatDateTimeRange(e.startsAt)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
