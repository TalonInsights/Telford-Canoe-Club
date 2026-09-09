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
import { BlocksView } from '@/components/site/blocks-view'
import { getContentBlock } from '@/lib/queries/content'

export const metadata: Metadata = {
  title: 'About the club',
  description:
    'Telford Canoe Club is a forward-thinking paddlesports club on the River Severn: qualified coaches, permanent facilities at Jackfield Rapids, and sixty years of history.',
}

export default async function AboutPage() {
  const intro = await getContentBlock('about.intro')

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
          {intro.length > 0 ? (
            <BlocksView body={intro} tone="ink" />
          ) : (
            <p className="text-ink-muted">
              The committee has not written this section yet.
            </p>
          )}
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
                    'Forty national-ranking slaloms, fifteen national-ranking river races, the New Town Games, and an active, thriving club.',
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
