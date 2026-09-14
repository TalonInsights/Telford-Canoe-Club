'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Search, User, X } from 'lucide-react'

import {
  auditCategories,
  auditCategoryLabel,
  auditLabel,
  auditSubjectName,
  categoryLabels,
  describeAudit,
  type AuditCategory,
} from '@/lib/audit/vocabulary'
import type { AuditEntry } from '@/lib/queries/audit'
import { formatDate, formatTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

/**
 * The club's change log, made readable.
 *
 * Category, date range and person are links, because they are database
 * filters and so search the whole log. The text box filters what is on screen
 * and says so, rather than pretending to search rows it has never seen.
 *
 * Entries are grouped by day because that is how anybody looking for something
 * actually searches: they remember roughly when, not what it was called.
 */

type Filter = { category?: AuditCategory; days?: number; personId?: string; show: number }

const ranges: { label: string; days?: number }[] = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last year', days: 365 },
  { label: 'Everything' },
]

/**
 * `today` and `yesterday` come from the server rather than `new Date()` here.
 * Reading the clock during render would let the server and the browser
 * disagree about what "Today" means either side of midnight, which shows up
 * as a hydration mismatch at exactly the hour nobody is watching.
 */
function dayHeading(iso: string, today: string, yesterday: string): string {
  const d = formatDate(iso)
  if (d === today) return 'Today'
  if (d === yesterday) return 'Yesterday'
  return d
}

export function AuditLog({
  entries,
  total,
  filter,
  personName,
  today,
  yesterday,
}: {
  entries: AuditEntry[]
  total: number
  filter: Filter
  personName: string | null
  today: string
  yesterday: string
}) {
  const [query, setQuery] = useState('')

  const rows = useMemo(
    () =>
      entries.map((e) => {
        const subject = auditSubjectName(e.after, e.before)
        return {
          entry: e,
          label: auditLabel(e.action),
          category: auditCategoryLabel(e.action),
          detail: describeAudit(e.before, e.after),
          subject,
          haystack: [
            auditLabel(e.action),
            e.action,
            e.entity,
            e.actorName ?? '',
            subject ?? '',
            describeAudit(e.before, e.after),
          ]
            .join(' ')
            .toLowerCase(),
        }
      }),
    [entries]
  )

  const q = query.trim().toLowerCase()
  const visible = q ? rows.filter((r) => r.haystack.includes(q)) : rows

  const days: { heading: string; items: typeof visible }[] = []
  for (const row of visible) {
    const heading = dayHeading(row.entry.created_at, today, yesterday)
    const last = days[days.length - 1]
    if (last && last.heading === heading) last.items.push(row)
    else days.push({ heading, items: [row] })
  }

  /**
   * Leave a key out to keep what is currently set; pass null to clear it.
   * Every filter is a plain link, so the log is shareable and the back button
   * works the way anyone reading a log expects it to.
   */
  const href = (patch: {
    category?: AuditCategory | null
    days?: number | null
    person?: string | null
    show?: number
  }) => {
    const category = patch.category !== undefined ? patch.category : filter.category
    const days = patch.days !== undefined ? patch.days : filter.days
    const person = patch.person !== undefined ? patch.person : filter.personId

    const p = new URLSearchParams()
    if (category) p.set('category', category)
    if (days) p.set('days', String(days))
    if (person) p.set('person', person)
    if (patch.show) p.set('show', String(patch.show))
    const s = p.toString()
    return s ? `/admin/audit?${s}` : '/admin/audit'
  }

  const chip = (label: string, active: boolean, to: string) => (
    <Link
      key={label}
      href={to}
      aria-current={active ? 'true' : undefined}
      className={cn(
        'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
        active
          ? 'border-river bg-river text-white'
          : 'border-stone bg-card text-ink-muted hover:border-river'
      )}
    >
      {label}
    </Link>
  )

  const filtered = filter.category || filter.days || filter.personId

  return (
    <div className="mt-6 grid gap-4">
      <div className="grid gap-3 rounded-xl border border-stone bg-card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search what is shown"
              aria-label="Search the entries on screen"
              className="h-11 w-64 max-w-full rounded-(--radius-control) border border-stone bg-card pr-3 pl-9 text-base outline-none focus-visible:border-river focus-visible:ring-3 focus-visible:ring-river/50"
            />
          </div>
          {chip('Everything that happened', !filter.category, href({ category: null }))}
          {auditCategories.map((c) =>
            chip(categoryLabels[c], filter.category === c, href({ category: c }))
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {ranges.map((r) =>
            chip(r.label, (filter.days ?? undefined) === r.days, href({ days: r.days ?? null }))
          )}
          {filter.personId && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-river bg-foam px-3 py-1.5 text-sm font-medium">
              <User aria-hidden="true" className="size-4 text-river" />
              Only {personName ?? 'this person'}
              <Link
                href={href({ person: null })}
                aria-label="Show everybody again"
                className="text-ink-muted hover:text-ink"
              >
                <X aria-hidden="true" className="size-4" />
              </Link>
            </span>
          )}
        </div>

        <p className="text-micro text-ink-muted">
          {q
            ? `${visible.length} of the ${rows.length} entries on screen match “${query}”.`
            : `Showing ${rows.length} of ${total} ${filtered ? 'matching entries' : 'entries'}.`}
          {' The filters above search the whole log; the box searches what is shown.'}
        </p>
      </div>

      {visible.length === 0 ? (
        <p className="rounded-xl border border-stone bg-card p-8 text-center text-sm text-ink-muted">
          Nothing matches. Try a wider date range, or a different category.
        </p>
      ) : (
        days.map((day) => (
          <section key={day.heading}>
            <h2 className="sticky top-0 z-10 bg-background/90 py-2 text-micro font-semibold tracking-wide text-ink-muted uppercase backdrop-blur">
              {day.heading}
            </h2>
            <ul className="grid gap-2">
              {day.items.map(({ entry, label, category, detail, subject }) => (
                <li
                  key={entry.id}
                  className="grid gap-1 rounded-xl border border-stone bg-card p-4 sm:grid-cols-[5rem_1fr] sm:gap-4"
                >
                  <span className="text-sm tabular-nums text-ink-muted">
                    {formatTime(entry.created_at)}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{label}</span>
                      <Badge variant="outline">{category}</Badge>
                    </div>
                    <p className="mt-1 text-sm break-words text-ink-muted">{detail}</p>
                    <p className="mt-1 text-micro text-ink-muted">
                      {entry.actorName && entry.actorId ? (
                        <>
                          by{' '}
                          <Link
                            href={href({ person: entry.actorId })}
                            className="font-medium text-river underline-offset-4 hover:underline"
                          >
                            {entry.actorName}
                          </Link>
                        </>
                      ) : (
                        'by the system'
                      )}
                      {subject && entry.entity === 'profiles' && entry.entity_id && (
                        <>
                          {' · about '}
                          <Link
                            href={`/admin/members/${entry.entity_id}`}
                            className="font-medium text-river underline-offset-4 hover:underline"
                          >
                            {subject}
                          </Link>
                        </>
                      )}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}

      {entries.length < total && (
        <div className="flex justify-center">
          <Button asChild variant="outline">
            <Link href={href({ show: filter.show + 200 })}>
              Show older entries ({total - entries.length} more)
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
