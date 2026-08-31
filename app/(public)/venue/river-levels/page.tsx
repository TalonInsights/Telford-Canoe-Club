import type { Metadata } from 'next'
import Link from 'next/link'
import { ExternalLink, Waves } from 'lucide-react'

import { PageHero } from '@/components/layout/page-hero'
import { Section } from '@/components/layout/section'
import { Button } from '@/components/ui/button'
import { formatDateShort, formatTime } from '@/lib/format'
import { getRiverLevel } from '@/lib/river-level'

export const metadata: Metadata = {
  title: 'River levels',
  description:
    'Live Severn level for Jackfield Rapids from the Environment Agency gauge at Buildwas, and how to read it before you paddle.',
}

export const revalidate = 900

export default async function RiverLevelsPage() {
  const level = await getRiverLevel()
  return (
    <>
      <PageHero
        title="River levels"
        intro="The rapid is a different place at different levels — check the gauge before you travel."
      />
      <Section tone="white">
        <div className="mx-auto w-full max-w-[720px]">
          <div className="rounded-xl border border-stone bg-foam p-6 text-center">
            <p className="flex items-center justify-center gap-1.5 text-micro font-medium text-ink-muted">
              <Waves className="size-3.5" aria-hidden="true" />
              {level ? `River Severn at ${level.stationName}` : 'River Severn — nearest gauge'}
            </p>
            {level ? (
              <>
                <p className="mt-1 font-heading text-5xl font-semibold tabular-nums">
                  {level.levelMetres.toFixed(2)} m
                </p>
                <p className="mt-1 text-micro text-ink-muted">
                  Environment Agency reading, {formatDateShort(level.readingTime)}{' '}
                  {formatTime(level.readingTime)} — updates through the day
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

          <div className="mt-10 space-y-3 text-ink-muted">
            <h2 className="text-xl text-ink">Reading the gauge</h2>
            <p>
              The nearest Environment Agency gauge is at Buildwas, a few miles upstream of
              Jackfield — what passes the gauge reaches the rapid shortly after. Low water
              exposes the rocks and slows the wave down; more flow builds the features and pushes
              harder. The Severn responds slowly to rain, so a wet day rarely changes the level
              instantly — but upstream reservoir releases (like the Clywedog) can add a useful
              top-up.
            </p>
            <p>
              The committee will publish guidance bands for the rapid here once they&apos;re
              agreed. Until then: if you&apos;re unsure whether it&apos;s a good level for your
              ability, ask on a club night before committing — and remember the site is used by
              competent paddlers at their own risk.
            </p>
          </div>

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
