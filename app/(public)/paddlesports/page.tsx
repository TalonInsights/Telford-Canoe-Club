import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

import { FullGrid } from '@/components/layout/grids'
import { PageHero } from '@/components/layout/page-hero'
import { Section } from '@/components/layout/section'
import { SportCard } from '@/components/site/cards'
import { CtaBand } from '@/components/site/cta-band'
import { Button } from '@/components/ui/button'
import { getPublishedPlaces, type PaddlePlace } from '@/lib/queries/paddle-places'
import { siteImageUrl } from '@/lib/storage/site-images'
import { getSportCards, IMAGES } from '@/lib/site-data'

export const metadata: Metadata = {
  title: 'Paddlesports',
  description:
    'Whitewater kayaking, freestyle and paddleboarding at Telford Canoe Club: one club, every kind of paddling, for all ages and abilities.',
}

function PlaceCard({ place }: { place: PaddlePlace }) {
  const photo = siteImageUrl(place.photoPath)
  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-stone bg-card">
      {photo && (
        <div className="relative aspect-video w-full">
          <Image src={photo} alt={place.name} fill sizes="(min-width: 1024px) 360px, 100vw" className="object-cover" />
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-heading text-lg font-semibold">{place.name}</h3>
        {place.description && <p className="mt-2 text-sm text-ink-muted">{place.description}</p>}
        {place.links.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
            {place.links.map((link, i) => (
              <li key={i}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium text-river underline-offset-4 hover:underline"
                >
                  {link.label} <ArrowUpRight aria-hidden="true" className="size-3.5" />
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  )
}

export default async function PaddlesportsPage() {
  const sports = getSportCards()
  const places = await getPublishedPlaces()
  const artificial = places.filter((p) => p.category === 'artificial')
  const natural = places.filter((p) => p.category === 'natural')
  return (
    <>
      <PageHero
        title="Paddlesports"
        intro="One club, every kind of paddling: a friendly, safe atmosphere across watersports for all age groups."
        image={IMAGES.anomaly}
        imageAlt="Kayakers paddling the rapid at Jackfield"
      />
      <Section tone="white">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="max-w-[68ch] lg:col-span-7">
            <p>
              Telford Canoe Club supports participants in every type of paddlesport. Our ethos is
              to promote and assist a friendly, safe club atmosphere across many different areas
              of watersports, for all age groups, from whitewater kayaking to standup
              paddleboarding, freestyle and beyond.
            </p>
            <p className="mt-4">
              The club doesn&apos;t restrict itself to set disciplines, either. Watersports evolve
              constantly, with new ways to enjoy the water being thought up all the time, and we
              aim to stay current so members can experience the full variety.
            </p>
            <p className="mt-4 text-ink-muted">
              At our core is whitewater kayaking, but if you want something more chilled out,
              paddleboarding is a lovely way to spend a summer evening session or a weekend trip.
            </p>
          </div>
          <div className="max-w-[68ch] lg:col-span-5">
            <div className="rounded-xl border border-stone bg-foam p-6">
              <h2 className="text-xl">Our home water</h2>
              <p className="mt-2 text-sm text-ink-muted">
                Our own rapid at Jackfield in the Ironbridge gorge is where club evenings run
                through the season. Beyond it, we travel to courses and rivers around the country,
                weather and water levels depending, listed below.
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
        intro="Three core sports, each with its own page, every one covered by the same membership."
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
      {places.length > 0 && (
        <Section
          tone="white"
          kicker="Beyond Jackfield"
          title="Where we paddle"
          intro="The courses and rivers the club paddles through the year, alongside our own water at Jackfield."
        >
          <div className="grid gap-8">
            {artificial.length > 0 && (
              <div>
                <h3 className="font-heading text-lg font-semibold text-ink-muted">Artificial courses</h3>
                <div className="mt-3">
                  <FullGrid maxColumns={3}>
                    {artificial.map((p) => (
                      <PlaceCard key={p.id} place={p} />
                    ))}
                  </FullGrid>
                </div>
              </div>
            )}
            {natural.length > 0 && (
              <div>
                <h3 className="font-heading text-lg font-semibold text-ink-muted">Natural rivers</h3>
                <div className="mt-3">
                  <FullGrid maxColumns={3}>
                    {natural.map((p) => (
                      <PlaceCard key={p.id} place={p} />
                    ))}
                  </FullGrid>
                </div>
              </div>
            )}
          </div>
        </Section>
      )}
      <CtaBand
        title="Ready to get on the water?"
        intro="One membership covers every discipline, club boats and kit included while you learn."
        primary={{ label: 'Join the club', href: '/join' }}
        secondary={{ label: "See what's on", href: '/events' }}
      />
    </>
  )
}
