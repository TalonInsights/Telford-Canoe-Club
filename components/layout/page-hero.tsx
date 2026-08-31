import Image from 'next/image'

import { cn } from '@/lib/utils'

import { Container } from './container'

/**
 * §3.4 inner-page hero: fixed heights (320px desktop / 240px mobile) so
 * content length never moves the fold. Title and intro sit left-aligned on
 * grid columns 1–8. Image is optional — the deep field carries it alone.
 */
export function PageHero({
  title,
  intro,
  image,
  imageAlt = '',
  breadcrumb,
  className,
}: {
  title: string
  intro?: string
  image?: string
  imageAlt?: string
  breadcrumb?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'relative flex h-[240px] items-end overflow-hidden bg-deep text-white md:h-[320px]',
        className
      )}
    >
      {image && (
        <Image
          src={image}
          alt={imageAlt}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      )}
      <div className="absolute inset-0 bg-deep/65" aria-hidden="true" />
      <Container className="relative z-10 pb-8 md:pb-10">
        <div className="lg:w-2/3">
          {breadcrumb && <div className="mb-3">{breadcrumb}</div>}
          <h1>{title}</h1>
          {intro && <p className="mt-2 max-w-[68ch] text-stone">{intro}</p>}
        </div>
      </Container>
    </div>
  )
}
