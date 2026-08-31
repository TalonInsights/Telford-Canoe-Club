import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Car, DoorOpen, MapPin, Waves } from 'lucide-react'

import { FullGrid, Split75 } from '@/components/layout/grids'
import { PageHero } from '@/components/layout/page-hero'
import { Section } from '@/components/layout/section'
import { Button } from '@/components/ui/button'
import { IMAGES } from '@/lib/site-data'

export const metadata: Metadata = {
  title: 'Venue — Jackfield Rapids',
  description:
    'The club’s own gated site at Jackfield Rapids in the Ironbridge gorge — address, parking, access and live river levels for the Severn.',
}

const ADDRESS = 'Jackfield Rapids, The Lloyds, Jackfield, Ironbridge, Telford TF8 7HJ'

export default function VenuePage() {
  return (
    <>
      <PageHero
        title="Jackfield Rapids"
        intro="The club's own gated site on the Severn, in the Ironbridge gorge."
        image={IMAGES.hero}
        imageAlt="Jackfield Rapids from above"
      />
      <Section tone="white">
        <Split75
          side="right"
          media={
            <Image
              src={IMAGES.rapid}
              alt="The Severn running through the gorge at Jackfield"
              fill
              sizes="(min-width: 1024px) 480px, 100vw"
              className="object-cover"
            />
          }
        >
          <p>
            The club has held the lease at Jackfield since 1987, and generations of members have
            shaped it since: the access road, parking, toilets and equipment containers were all
            built with the help of the local army reserves. It adds up to something rare — a
            whitewater venue where you park next to the water, get changed in peace, and walk
            straight to the rapid.
          </p>
          <p className="mt-4 text-ink-muted">
            The site is open as normal for use by competent paddlers at their own risk, and club
            sessions run through the season. Members receive the current gate code after logging
            in.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild variant="secondary">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADDRESS)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open in Google Maps
              </a>
            </Button>
            <Button asChild variant="outline">
              <Link href="/venue/river-levels">River levels</Link>
            </Button>
          </div>
        </Split75>
      </Section>
      <Section tone="foam" title="The practical bits">
        <FullGrid maxColumns={4}>
          {[
            {
              icon: MapPin,
              title: 'Finding us',
              body: ADDRESS,
            },
            {
              icon: Car,
              title: 'Parking',
              body: 'On-site parking right by the river — unload boats at the water.',
            },
            {
              icon: DoorOpen,
              title: 'Access',
              body: 'The site is gated. Members get the current gate code in the members area.',
            },
            {
              icon: Waves,
              title: 'The water',
              body: 'A natural rapid whose character changes with the level — check before you travel.',
            },
          ].map((f) => (
            <div key={f.title} className="flex h-full flex-col rounded-xl border border-stone bg-card p-5">
              <span className="flex size-11 items-center justify-center rounded-lg bg-foam">
                <f.icon className="size-5 text-river" aria-hidden="true" />
              </span>
              <h3 className="mt-3 text-lg">{f.title}</h3>
              <p className="mt-1 text-sm text-ink-muted">{f.body}</p>
            </div>
          ))}
        </FullGrid>
      </Section>
      <Section tone="deep" spacing="tight" title="Check the river before you set off">
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="signal">
            <Link href="/venue/river-levels">Live river levels</Link>
          </Button>
          <Button asChild className="border border-white/40 bg-white/10 text-white hover:bg-white/20">
            <Link href="/events">Session times</Link>
          </Button>
        </div>
      </Section>
    </>
  )
}
