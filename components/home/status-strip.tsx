/**
 * HOME brief — status strip: four equal cells directly under the hero.
 * site status · EA river level (live, 15-min cache) · rapid today · next on
 * site. The strip never collapses: every cell renders in every state.
 * With settings.levelBands = null (D15 open) the "Rapid today" cell is a
 * neutral link, never a judgement about the water.
 */

import { ArrowUpRight, CalendarDays, DoorOpen, Waves } from 'lucide-react'
import Link from 'next/link'

import { Container } from '@/components/layout/container'
import { formatDateShort, formatTime } from '@/lib/format'
import { getRiverLevel } from '@/lib/river-level'
import { getNextOnSite, getSiteSettings } from '@/lib/site-data'
import { cn } from '@/lib/utils'

function Cell({
  label,
  value,
  detail,
  href,
  external,
  icon: Icon,
  tone = 'neutral',
}: {
  label: string
  value: string
  detail?: string
  href?: string
  external?: boolean
  icon: React.ComponentType<{ className?: string }>
  tone?: 'neutral' | 'success'
}) {
  const body = (
    <>
      <p className="flex items-center gap-1.5 text-micro font-medium text-ink-muted">
        <Icon className="size-3.5" aria-hidden="true" />
        {label}
      </p>
      <p
        className={cn(
          'mt-1 flex items-baseline gap-1.5 font-heading font-semibold',
          tone === 'success' && 'text-success'
        )}
      >
        {tone === 'success' && (
          <span aria-hidden="true" className="size-2 translate-y-[-1px] rounded-full bg-success" />
        )}
        {value}
        {href && <ArrowUpRight aria-hidden="true" className="size-3.5 self-center text-river" />}
      </p>
      {detail && <p className="text-micro text-ink-muted">{detail}</p>}
    </>
  )

  const cellClass =
    'flex min-h-[5.5rem] flex-col justify-center border-stone px-4 py-3 max-sm:border-b sm:border-r sm:last:border-r-0 max-sm:last:border-b-0'

  if (!href) return <div className={cellClass}>{body}</div>
  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cn(cellClass, 'transition-colors hover:bg-foam')}>
      {body}
    </a>
  ) : (
    <Link href={href} className={cn(cellClass, 'transition-colors hover:bg-foam')}>
      {body}
    </Link>
  )
}

export async function StatusStrip() {
  const settings = getSiteSettings()
  const next = getNextOnSite()
  const level = await getRiverLevel()

  return (
    <div className="border-b border-stone bg-card">
      <Container className="max-md:px-0">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4">
          <Cell
            icon={DoorOpen}
            label="Site status"
            value={settings.siteStatus === 'open' ? 'Site open' : 'Site closed'}
            detail={settings.siteStatusNote ?? 'Jackfield Rapids, Ironbridge'}
            tone={settings.siteStatus === 'open' ? 'success' : 'neutral'}
          />
          {level ? (
            <Cell
              icon={Waves}
              label={`Severn at ${level.stationName}`}
              value={`${level.levelMetres.toFixed(2)} m`}
              detail={`EA reading, ${formatDateShort(level.readingTime)} ${formatTime(level.readingTime)}`}
              href={level.stationUrl}
              external
            />
          ) : (
            <Cell
              icon={Waves}
              label="Severn level"
              value="Level unavailable"
              detail="Check the EA gauge"
              href="https://check-for-flooding.service.gov.uk/station/2134"
              external
            />
          )}
          <Cell
            icon={Waves}
            label="Rapid today"
            value="See river levels"
            detail="What the gauge means for the water"
            href="/the-site/river-levels"
          />
          {next ? (
            <Cell
              icon={CalendarDays}
              label="Next on site"
              value={next.title}
              detail={formatDateShort(next.startsAt)}
              href={`/events/${next.slug}`}
            />
          ) : (
            <Cell
              icon={CalendarDays}
              label="Next on site"
              value="Nothing scheduled"
              detail="See all events"
              href="/events"
            />
          )}
        </div>
      </Container>
    </div>
  )
}
