import type { Metadata } from 'next'
import Link from 'next/link'
import { Camera, ExternalLink, Waves } from 'lucide-react'

import { PageHero } from '@/components/layout/page-hero'
import { Section } from '@/components/layout/section'
import { Button } from '@/components/ui/button'
import { formatDateShort, formatTime } from '@/lib/format'
import { BlocksView } from '@/components/site/blocks-view'
import { getContentBlock } from '@/lib/queries/content'
import { getClubSettings } from '@/lib/queries/settings'
import { getRiverBands } from '@/lib/queries/river-bands'
import { getRiverLevel } from '@/lib/river-level'
import { bandRangeLabel, matchBand, metresToCm } from '@/lib/river/bands'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'River levels',
  description:
    'Live Severn level for Jackfield Rapids from the Environment Agency gauge at Buildwas, what the level means for the rapid, and an upstream webcam.',
}

export const revalidate = 900

export default async function RiverLevelsPage() {
  const [level, bands, settings, guidance] = await Promise.all([
    getRiverLevel(),
    getRiverBands(),
    getClubSettings(),
    getContentBlock('river.guidance'),
  ])

  const cm = level ? metresToCm(level.levelMetres) : null
  const current = cm === null ? null : matchBand(bands, cm)

  return (
    <>
      <PageHero
        title="River levels"
        intro="The rapid is a different place at different levels, check the gauge before you travel."
        crumbs={[{ title: 'Venue', href: '/venue' }]}
      />
      <Section tone="white">
        <div className="mx-auto w-full max-w-[720px]">
          <div className="rounded-xl border border-stone bg-foam p-6 text-center">
            <p className="flex items-center justify-center gap-1.5 text-micro font-medium text-ink-muted">
              <Waves className="size-3.5" aria-hidden="true" />
              {level ? `River Severn at ${level.stationName}` : 'River Severn, nearest gauge'}
            </p>

            {level && cm !== null ? (
              <>
                {/* The club's word for it leads, because that is the thing a
                    paddler is actually asking. The number backs it up. */}
                {current && (
                  <p className="mt-2 font-heading text-4xl font-semibold text-river">
                    {current.label}
                  </p>
                )}
                <p
                  className={cn(
                    'font-heading font-semibold tabular-nums',
                    current ? 'mt-1 text-2xl' : 'mt-1 text-5xl'
                  )}
                >
                  {cm} cm
                  <span className="ml-2 text-base font-normal text-ink-muted">
                    ({level.levelMetres.toFixed(2)} m)
                  </span>
                </p>
                {current?.description && (
                  <p className="mx-auto mt-2 max-w-[46ch] text-sm text-ink-muted">
                    {current.description}
                  </p>
                )}
                {!current && bands.length > 0 && (
                  <p className="mx-auto mt-2 max-w-[46ch] text-sm text-warn">
                    This reading sits outside the club&apos;s guidance bands. Ask before you travel.
                  </p>
                )}
                <p className="mt-2 text-micro text-ink-muted">
                  Environment Agency reading, {formatDateShort(level.readingTime)}{' '}
                  {formatTime(level.readingTime)}, updates through the day
                </p>
              </>
            ) : (
              <p className="mt-1 font-heading text-2xl font-semibold">Level unavailable right now</p>
            )}

            <Button asChild variant="secondary" className="mt-4">
              <a
                href={level?.stationUrl ?? 'https://check-for-flooding.service.gov.uk/station/2134'}
                target="_blank"
                rel="noopener noreferrer"
              >
                Full gauge history on the EA site
                <ExternalLink aria-hidden="true" />
              </a>
            </Button>
          </div>

          {bands.length > 0 && (
            <div className="mt-10">
              <h2 className="text-xl">What the level means</h2>
              <p className="mt-1 text-sm text-ink-muted">
                The committee&apos;s guidance for Jackfield, in centimetres on the Buildwas gauge.
              </p>
              <ul className="mt-4 grid gap-2">
                {bands.map((band) => {
                  const isNow = current?.id === band.id
                  return (
                    <li
                      key={band.id}
                      className={cn(
                        'flex flex-wrap items-baseline gap-x-4 gap-y-1 rounded-xl border p-4',
                        isNow ? 'border-river bg-foam' : 'border-stone bg-card'
                      )}
                    >
                      <span className="w-32 shrink-0 text-sm font-medium tabular-nums text-ink-muted">
                        {bandRangeLabel(band)}
                      </span>
                      <span className="font-heading font-semibold">{band.label}</span>
                      {isNow && (
                        <span className="rounded-full bg-river px-2 py-0.5 text-micro font-medium text-white">
                          Now
                        </span>
                      )}
                      {band.description && (
                        <span className="w-full text-sm text-ink-muted">{band.description}</span>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          {settings.webcamUrl && (
            <div className="mt-10 rounded-xl border border-stone bg-card p-5">
              <h2 className="flex items-center gap-2 text-xl">
                <Camera aria-hidden="true" className="size-5 text-river" />
                See the water
              </h2>
              <p className="mt-2 text-sm text-ink-muted">{settings.webcamNote}</p>
              <Button asChild variant="secondary" className="mt-3">
                <a href={settings.webcamUrl} target="_blank" rel="noopener noreferrer">
                  Open the Atcham webcam
                  <ExternalLink aria-hidden="true" />
                </a>
              </Button>
              <p className="mt-2 text-micro text-ink-muted">
                Opens on Farson Digital Watercams, who run the camera.
              </p>
            </div>
          )}

          {guidance.length > 0 && (
            <div className="mt-10">
              <h2 className="text-xl">Reading the gauge</h2>
              <div className="mt-2">
                <BlocksView body={guidance} />
              </div>
            </div>
          )}

          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild variant="secondary">
              <Link href="/venue">Back to the venue</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/events">Club sessions</Link>
            </Button>
          </div>
        </div>
      </Section>
    </>
  )
}
