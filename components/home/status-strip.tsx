/**
 * HOME brief — status strip: equal cells directly under the hero.
 * site status · EA river level (live, 15-min cache) · rapid today · EA bathing
 * water quality (live, added 8 Sep 2026 on the chairman's instruction) · next
 * on site. The strip never collapses: every cell renders in every state.
 * "Rapid today" reads the committee's own guidance bands (0024) against the
 * live reading, so it says what the level means in the club's words. With no
 * band matching it falls back to the movement, and then to a plain link: it
 * never invents a judgement about the water.
 */

import {
  ArrowUpRight,
  CalendarDays,
  Droplets,
  DoorOpen,
  Minus,
  TrendingDown,
  TrendingUp,
  Waves,
} from 'lucide-react'
import Link from 'next/link'

import { Container } from '@/components/layout/container'
import { formatDateShort, formatTime } from '@/lib/format'
import { describeRiverTrend, getRiverLevel, type RiverTrend } from '@/lib/river-level'
import { getRiverBands } from '@/lib/queries/river-bands'
import { matchBand, metresToCm } from '@/lib/river/bands'
import { getClubSettings } from '@/lib/queries/settings'
import { getUpcomingEvents } from '@/lib/queries/events'
import { bathingWaterProfileUrl, describeWaterQuality, getWaterQuality } from '@/lib/water-quality'
import { cn } from '@/lib/utils'

function Cell({
  label,
  value,
  detail,
  href,
  external,
  icon: Icon,
  tone = 'neutral',
  className,
}: {
  label: string
  value: string
  detail?: string
  href?: string
  external?: boolean
  icon: React.ComponentType<{ className?: string }>
  tone?: 'neutral' | 'success' | 'warn'
  className?: string
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
          tone === 'success' && 'text-success',
          tone === 'warn' && 'text-warn'
        )}
      >
        {tone !== 'neutral' && (
          <span
            aria-hidden="true"
            className={cn(
              'size-2 translate-y-[-1px] rounded-full',
              tone === 'success' ? 'bg-success' : 'bg-warn'
            )}
          />
        )}
        {value}
        {href && <ArrowUpRight aria-hidden="true" className="size-3.5 self-center text-river" />}
      </p>
      {detail && <p className="text-micro text-ink-muted">{detail}</p>}
    </>
  )

  // Tops aligned rather than centred: with five cells a wrapped value or
  // detail is common, and centring each cell on its own height left the
  // labels and readings sitting at five different heights.
  const cellClass = cn(
    'flex min-h-[5.5rem] flex-col justify-start border-stone px-4 py-3 max-sm:border-b sm:border-r sm:last:border-r-0 max-sm:last:border-b-0',
    className
  )

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

const trendIcons: Record<RiverTrend, React.ComponentType<{ className?: string }>> = {
  rising: TrendingUp,
  falling: TrendingDown,
  steady: Minus,
}

export async function StatusStrip() {
  const [settings, upcoming, level, water, bands] = await Promise.all([
    getClubSettings(),
    getUpcomingEvents(1),
    getRiverLevel(),
    getWaterQuality(),
    getRiverBands(),
  ])
  const next = upcoming[0] ?? null
  const quality = water ? describeWaterQuality(water) : null
  const movement = level ? describeRiverTrend(level) : null
  // The committee's own guidance, matched to the live reading. When they have
  // set bands this cell says what the level means; until then it reports the
  // movement and lets the river levels page do the explaining.
  const band = level ? matchBand(bands, metresToCm(level.levelMetres)) : null

  return (
    <div className="border-b border-stone bg-card">
      <Container className="max-md:px-0">
        {/* Five cells: two rows of two plus a full-width fifth between 640 and
            1024px, so no row is ever left short (§3.4 orphan rule). */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-5">
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
          {band ? (
            <Cell
              icon={movement ? trendIcons[movement.trend] : Waves}
              label="Rapid today"
              value={band.label}
              detail={
                movement
                  ? `${metresToCm(level!.levelMetres)} cm, ${movement.value.toLowerCase()}`
                  : `${metresToCm(level!.levelMetres)} cm at Buildwas`
              }
              href="/venue/river-levels"
            />
          ) : movement ? (
            <Cell
              icon={trendIcons[movement.trend]}
              label="Rapid today"
              value={movement.value}
              detail={movement.detail}
              href="/venue/river-levels"
            />
          ) : (
            <Cell
              icon={Waves}
              label="Rapid today"
              value="See river levels"
              detail="What the gauge means"
              href="/venue/river-levels"
            />
          )}
          {water && quality ? (
            <Cell
              icon={Droplets}
              label="Water quality"
              value={quality.value}
              detail={quality.detail}
              href={water.profileUrl}
              external
              tone={quality.warn ? 'warn' : 'neutral'}
            />
          ) : (
            <Cell
              icon={Droplets}
              label="Water quality"
              value="See the EA rating"
              detail="Bathing water at Ironbridge"
              href={bathingWaterProfileUrl()}
              external
            />
          )}
          {next ? (
            <Cell
              icon={CalendarDays}
              label="Next on site"
              value={next.title}
              detail={formatDateShort(next.starts_at)}
              href={`/events/${next.slug}`}
              className="sm:max-lg:col-span-2"
            />
          ) : (
            <Cell
              icon={CalendarDays}
              label="Next on site"
              value="Nothing scheduled"
              detail="See all events"
              href="/events"
              className="sm:max-lg:col-span-2"
            />
          )}
        </div>
      </Container>
    </div>
  )
}
