'use client'

/**
 * P0-08 — layout pattern from 21st.dev "Hero with image, text and two buttons"
 * (https://21st.dev/@tommyjepsen/components/hero-with-image-text-and-two-buttons,
 * MIT). Rebuilt for §3.4/§3.7: fixed svh heights (72 desktop / 80 mobile) so
 * copy never moves the fold, full-bleed image under a 65% deep overlay,
 * left-aligned on the grid, and the site's single orchestrated reveal —
 * played once per full page load (module flag), skipped for reduced motion.
 */

import Image from 'next/image'
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'

import { Container } from '@/components/layout/container'
import { Button } from '@/components/ui/button'

let heroRevealPlayed = false

export function HomeHero({
  title,
  intro,
  image,
  imageAlt,
  primary,
  secondary,
}: {
  title: string
  intro: string
  image: string
  imageAlt: string
  primary: { label: string; href: string }
  secondary: { label: string; href: string }
}) {
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
        src={image}
        alt={imageAlt}
        fill
        priority
        sizes="100vw"
        className="object-cover object-[70%_center] md:object-center"
      />
      <motion.div
        className="absolute inset-0 bg-deep/65"
        aria-hidden="true"
        {...(animate
          ? {
              initial: { opacity: 0 },
              animate: { opacity: 1 },
              transition: { duration: 0.4 },
            }
          : {})}
      />
      <Container className="relative z-10 pb-14 md:pb-20">
        <div className="max-w-[40rem] lg:w-2/3">
          <motion.h1 {...rise(0)}>{title}</motion.h1>
          <motion.p className="mt-4 max-w-[68ch] text-lg text-stone" {...rise(0.1)}>
            {intro}
          </motion.p>
          <motion.div className="mt-7 flex flex-wrap gap-3" {...rise(0.15)}>
            <Button asChild variant="signal" size="lg">
              <Link href={primary.href}>{primary.label}</Link>
            </Button>
            <Button
              asChild
              size="lg"
              className="border border-white/40 bg-white/10 text-white hover:bg-white/20"
            >
              <Link href={secondary.href}>{secondary.label}</Link>
            </Button>
          </motion.div>
        </div>
      </Container>
    </section>
  )
}
