'use client'

/**
 * HOME brief — hero: client component, one-time reveal (module flag, once per
 * full page load), fixed svh heights (80 mobile / 72 desktop) so copy never
 * moves the fold, hero image confirmed as Jackfield-high-view.jpg with the
 * focal point at 40% from the left. Reduced motion renders static; the CSS
 * reveal-guarantee keeps content visible if animation frames never run.
 */

import { motion, useReducedMotion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { Container } from '@/components/layout/container'
import { ClubBadge } from '@/components/site/brand'
import { Button } from '@/components/ui/button'

let heroRevealPlayed = false

export function Hero() {
  const reduced = useReducedMotion()
  const [firstFullLoad] = useState(() => !heroRevealPlayed)
  useEffect(() => {
    heroRevealPlayed = true
  }, [])
  const animate = !reduced && firstFullLoad

  const rise = (delay: number) =>
    animate
      ? {
          initial: { opacity: 0, y: 12 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5, ease: 'easeOut' as const, delay },
        }
      : {}

  return (
    <section className="relative flex min-h-[80svh] items-end overflow-hidden bg-deep text-white md:min-h-[72svh]">
      <Image
        src="/images/placeholders/hero-jackfield.jpg"
        alt="Looking down on the River Severn breaking into rapids at Jackfield"
        fill
        priority
        sizes="100vw"
        className="object-cover object-[40%_center]"
      />
      {/* Gradient, not a flat wash: the photo stays legible up top while the
          text zone at the foot keeps AA contrast for white type. */}
      <motion.div
        className="tcc-reveal-guarantee absolute inset-0 bg-gradient-to-t from-deep/95 via-deep/70 via-45% to-deep/10"
        aria-hidden="true"
        {...(animate
          ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.4 } }
          : {})}
      />
      {/* DR-09: the badge as a watermark fills the empty right two-thirds at
          desktop — line art at 12% so the water still reads through it. */}
      <ClubBadge
        detailed
        className="pointer-events-none absolute right-[6%] bottom-[14%] hidden size-80 text-white/[0.12] lg:block xl:size-96"
      />
      <Container className="relative z-10 pb-14 md:pb-20">
        <div className="max-w-[40rem] lg:w-2/3">
          <motion.h1 className="tcc-reveal-guarantee" {...rise(0)}>
            Your own stretch of the Severn
          </motion.h1>
          <motion.p
            className="tcc-reveal-guarantee mt-4 max-w-[68ch] text-lg text-stone"
            {...rise(0.1)}
          >
            That&apos;s what makes Telford Canoe Club different: our own gated site and our own
            rapid at Jackfield, in the Ironbridge gorge. Join, and this water is yours to
            paddle — whitewater, freestyle and paddleboarding included.
          </motion.p>
          <motion.div className="tcc-reveal-guarantee mt-7 flex flex-wrap gap-3" {...rise(0.15)}>
            <Button asChild variant="signal" size="lg">
              <Link href="/join">Join the club</Link>
            </Button>
            <Button asChild variant="inverse" size="lg">
              <Link href="/events">When we paddle</Link>
            </Button>
          </motion.div>
        </div>
      </Container>
    </section>
  )
}
