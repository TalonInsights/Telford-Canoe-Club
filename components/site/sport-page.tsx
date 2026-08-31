import Image from 'next/image'
import Link from 'next/link'

import { Split75 } from '@/components/layout/grids'
import { PageHero } from '@/components/layout/page-hero'
import { Section } from '@/components/layout/section'
import { Button } from '@/components/ui/button'

/**
 * Shared shape for the three sport pages: PageHero, then alternating 7/5
 * splits (§3.4 shape 2) with the migrated copy and captioned photography,
 * closing on the join band. Guarantees the three pages stay symmetrical.
 */

export type SportSection = {
  heading?: string
  paragraphs: string[]
  image: string
  imageAlt: string
  caption?: string
}

export function SportPage({
  title,
  intro,
  heroImage,
  heroImageAlt,
  sections,
  closing,
}: {
  title: string
  intro: string
  heroImage: string
  heroImageAlt: string
  sections: SportSection[]
  closing: string
}) {
  return (
    <>
      <PageHero title={title} intro={intro} image={heroImage} imageAlt={heroImageAlt} />
      {sections.map((section, i) => (
        <Section key={i} tone={i % 2 === 0 ? 'white' : 'foam'}>
          <Split75
            side={i % 2 === 0 ? 'right' : 'left'}
            media={
              <figure className="h-full w-full">
                <Image
                  src={section.image}
                  alt={section.imageAlt}
                  fill
                  sizes="(min-width: 1024px) 480px, 100vw"
                  className="object-cover"
                />
                {section.caption && (
                  <figcaption className="absolute inset-x-0 bottom-0 bg-deep/80 px-4 py-2 text-micro text-stone">
                    {section.caption}
                  </figcaption>
                )}
              </figure>
            }
          >
            {section.heading && <h2>{section.heading}</h2>}
            {section.paragraphs.map((p, j) => (
              <p key={j} className={j === 0 && !section.heading ? '' : 'mt-4'}>
                {p}
              </p>
            ))}
          </Split75>
        </Section>
      ))}
      <Section tone="deep" spacing="tight" title={closing}>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="signal">
            <Link href="/join">Join the club</Link>
          </Button>
          <Button asChild className="border border-white/40 bg-white/10 text-white hover:bg-white/20">
            <Link href="/paddlesports">All paddlesports</Link>
          </Button>
        </div>
      </Section>
    </>
  )
}
