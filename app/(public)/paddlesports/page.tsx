import type { Metadata } from 'next'
import Link from 'next/link'

import { FullGrid } from '@/components/layout/grids'
import { PageHero } from '@/components/layout/page-hero'
import { Section } from '@/components/layout/section'
import { SportCard } from '@/components/site/cards'
import { Button } from '@/components/ui/button'
import { getSportCards, IMAGES } from '@/lib/site-data'

export const metadata: Metadata = {
  title: 'Paddlesports',
  description:
    'Whitewater kayaking, freestyle and paddleboarding at Telford Canoe Club — one club, every kind of paddling, for all ages and abilities.',
}

export default function PaddlesportsPage() {
  const sports = getSportCards()
  return (
    <>
      <PageHero
        title="Paddlesports"
        intro="One club, every kind of paddling — a friendly, safe atmosphere across watersports for all age groups."
        image={IMAGES.anomaly}
        imageAlt="Kayakers paddling the rapid at Jackfield"
      />
      <Section tone="white">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="max-w-[68ch] lg:col-span-7">
            <p>
              Telford Canoe Club supports participants in every type of paddlesport. Our ethos is
              to promote and assist a friendly, safe club atmosphere across many different areas
              of watersports, for all age groups — from whitewater kayaking to standup
              paddleboarding, freestyle and beyond.
            </p>
            <p className="mt-4">
              The club doesn&apos;t restrict itself to set disciplines, either. Watersports evolve
              constantly, with new ways to enjoy the water being thought up all the time, and we
              aim to stay current so members can experience the full variety.
            </p>
            <p className="mt-4 text-ink-muted">
              At our core is whitewater kayaking — but if you want something more chilled out,
              paddleboarding is a lovely way to spend a summer evening session or a weekend trip.
            </p>
          </div>
          <div className="max-w-[68ch] lg:col-span-5">
            <div className="rounded-xl border border-stone bg-foam p-6">
              <h2 className="text-xl">Where we paddle</h2>
              <p className="mt-2 text-sm text-ink-muted">
                Our own rapid at Jackfield in the Ironbridge gorge; the River Dee in North Wales;
                manmade venues like Cardiff International White Water — and in the autumn and
                winter season, trips to suitable rivers around the country, weather and water
                levels depending.
              </p>
              <Button asChild variant="secondary" className="mt-4">
                <Link href="/venue">About our venue</Link>
              </Button>
            </div>
          </div>
        </div>
      </Section>
      <Section
        tone="foam"
        title="Pick your discipline"
        intro="Three core sports, each with its own page — every one covered by the same membership."
      >
        <FullGrid maxColumns={3}>
          {sports.map((s) => (
            <SportCard
              key={s.slug}
              href={`/paddlesports/${s.slug}`}
              image={s.image}
              imageAlt={s.imageAlt}
              title={s.title}
              summary={s.summary}
            />
          ))}
        </FullGrid>
      </Section>
      <Section tone="deep" spacing="tight" title="Ready to get on the water?">
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="signal">
            <Link href="/join">Join the club</Link>
          </Button>
          <Button asChild className="border border-white/40 bg-white/10 text-white hover:bg-white/20">
            <Link href="/events">See what&apos;s on</Link>
          </Button>
        </div>
      </Section>
    </>
  )
}
