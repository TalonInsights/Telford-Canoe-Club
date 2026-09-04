import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import { Split75 } from '@/components/layout/grids'
import { PageHero } from '@/components/layout/page-hero'
import { Section } from '@/components/layout/section'
import { CtaBand } from '@/components/site/cta-band'
import { Timeline } from '@/components/site/timeline'
import { Button } from '@/components/ui/button'
import { IMAGES } from '@/lib/site-data'

export const metadata: Metadata = {
  title: 'About the club',
  description:
    'Telford Canoe Club is a forward-thinking paddlesports club on the River Severn — qualified coaches, permanent facilities at Jackfield Rapids, and sixty years of history.',
}

export default function AboutPage() {
  return (
    <>
      <PageHero
        title="About Telford Canoe Club"
        intro="A forward-thinking paddlesports club, run by its members, on its own stretch of the Severn."
        image={IMAGES.rapid}
        imageAlt="The River Severn at Jackfield"
      />
      <Section tone="white">
        <Split75
          side="right"
          media={
            <Image
              src={IMAGES.anomaly}
              alt="Club paddlers on the water at Jackfield"
              fill
              sizes="(min-width: 1024px) 480px, 100vw"
              className="object-cover"
            />
          }
        >
          <p>
            Telford Canoe Club is a forward-thinking paddlesports club based in Telford. We run on
            an ethos of encouraging paddlesports — whitewater kayaking and canoeing, freestyle,
            standup paddleboarding and more — to the widest possible range of participants. Our
            view is simple: there&apos;s nothing more mentally stimulating than time on the water
            in a natural environment, developing new skills and enjoying the outdoors.
          </p>
          <p className="mt-4">
            Whether you&apos;re aiming to push yourself on white water, throw the latest freestyle
            tricks, or just want a relaxing paddle along a river or lake, the club can cater to
            you. Run by experienced, qualified coaches and guides, we&apos;ll take you safely from
            beginner onwards in an enthusiastic, safe and encouraging environment.
          </p>
          <p className="mt-4 text-ink-muted">
            With permanent facilities and parking right next to the Severn&apos;s Jackfield
            rapids, we run regular club nights and social BBQs through the long summer evenings,
            weekend trips to the River Dee and venues like Cardiff International White Water — and
            when the autumn rains open up the UK whitewater season, trips to rivers around the
            country, weather and water levels depending.
          </p>
        </Split75>
      </Section>
      <Section
        tone="foam"
        title="Sixty years on the Severn"
        intro="The club has been part of the gorge since the early days of Telford itself."
      >
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Timeline
              entries={[
                {
                  marker: 'Early 1960s',
                  title: 'A hut below the Black Swan',
                  description:
                    'A few keen enthusiasts start the club from a hut just below the Black Swan pub.',
                },
                {
                  marker: '1980s',
                  title: 'The river takes the hut',
                  description:
                    'With the hut falling into the river, the club moves to Dale End Park for a while; some years later the hut and the bungalow next to it are lost to the water.',
                },
                {
                  marker: '1987',
                  title: 'The Jackfield lease',
                  description:
                    'A lease is agreed for the current site at Jackfield Rapids. Roads, parking, toilets and the containers are all added with the help of the local army reserves.',
                },
                {
                  marker: 'Since then',
                  title: 'A racing and community pedigree',
                  description:
                    'Forty national-ranking slaloms, fifteen national-ranking river races, the New Town Games — and an active, thriving club.',
                },
              ]}
            />
          </div>
          <div className="lg:col-span-5">
            <div className="rounded-xl border border-stone bg-card p-6">
              <h3 className="text-lg">Where will your paddlesports journey take you?</h3>
              <p className="mt-2 text-sm text-ink-muted">
                Meet the people who run the club, read our policies, or come straight down to the
                water.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild variant="secondary" size="sm">
                  <Link href="/about/committee">The committee</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/about/policies">Club policies</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/venue">Our venue</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Section>
      <CtaBand
        title="Be part of the next chapter"
        intro="Sixty years in, the club is still run by the people who paddle here."
        primary={{ label: 'Join the club', href: '/join' }}
        secondary={{ label: 'Get in touch', href: '/contact' }}
      />
    </>
  )
}
