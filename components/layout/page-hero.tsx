import Image from 'next/image'
import Link from 'next/link'

import { BridgeArch } from '@/components/site/brand'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { cn } from '@/lib/utils'

import { Container } from './container'

export type Crumb = { title: string; href: string }

/**
 * §3.4 inner-page hero: fixed heights (320px desktop / 240px mobile) so
 * content length never moves the fold. Title and intro sit left-aligned on
 * grid columns 1–8.
 *
 * DR-06: photos sit under a gradient (deep at the text foot, thinning towards
 * the top) so the water stays visible while white type keeps AA contrast;
 * image-less heroes carry the Iron Bridge line drawing instead of an empty
 * field. `crumbs` are the parents of this page — §3.5 rule 5 wants a trail on
 * every page below the top level; the current page is the title itself.
 */
export function PageHero({
  title,
  intro,
  image,
  imageAlt = '',
  crumbs,
  breadcrumb,
  className,
}: {
  title: string
  intro?: string
  image?: string
  imageAlt?: string
  crumbs?: Crumb[]
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
      {image ? (
        <>
          <Image
            src={image}
            alt={imageAlt}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-deep/95 via-deep/65 via-40% to-deep/25"
            aria-hidden="true"
          />
        </>
      ) : (
        <BridgeArch className="absolute -right-16 -bottom-4 hidden w-[560px] text-white/[0.08] md:block" />
      )}
      <Container className="relative z-10 pb-8 md:pb-10">
        <div className="lg:w-2/3">
          {crumbs && crumbs.length > 0 && (
            <Breadcrumb className="mb-3">
              <BreadcrumbList className="text-micro text-stone/85 sm:text-sm">
                <BreadcrumbItem>
                  <BreadcrumbLink asChild className="hover:text-white">
                    <Link href="/">Home</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {crumbs.map((crumb) => (
                  <BreadcrumbItem key={crumb.href} className="contents">
                    <BreadcrumbSeparator className="text-stone/60" />
                    <BreadcrumbLink asChild className="hover:text-white">
                      <Link href={crumb.href}>{crumb.title}</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                ))}
                <BreadcrumbSeparator className="text-stone/60" />
                <BreadcrumbItem className="min-w-0">
                  <BreadcrumbPage className="block max-w-[32ch] truncate text-white">
                    {title}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          )}
          {breadcrumb && <div className="mb-3">{breadcrumb}</div>}
          <h1>{title}</h1>
          {intro && <p className="mt-2 max-w-[68ch] text-stone">{intro}</p>}
        </div>
      </Container>
    </div>
  )
}
