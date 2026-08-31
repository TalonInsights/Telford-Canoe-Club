/**
 * P0-09 — one card anatomy for the whole site (§3.4): image 3:2 → h3 title →
 * 2-line clamp summary → meta row → footer pinned with mt-auto. Structure
 * referenced from 21st.dev "Blog 8"
 * (https://21st.dev/@shadcnblockscom/components/blog8, MIT), rebuilt on TCC
 * tokens: stone border, 12px radius, no shadow; hover/focus turns the border
 * river because the card is interactive — information, not decoration.
 */

import Image from 'next/image'
import Link from 'next/link'

import { ImageFallback } from '@/components/site/image-fallback'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function CardShell({
  href,
  image,
  imageAlt = '',
  imageSizes = '(min-width: 1024px) 384px, (min-width: 640px) 50vw, 100vw',
  eyebrow,
  title,
  summary,
  meta,
  footer,
  className,
}: {
  href: string
  image?: string | null
  imageAlt?: string
  imageSizes?: string
  eyebrow?: React.ReactNode
  title: string
  summary?: string
  meta?: React.ReactNode
  footer?: React.ReactNode
  className?: string
}) {
  return (
    <article
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-xl border border-stone bg-card transition-colors',
        'hover:border-river focus-within:border-river',
        className
      )}
    >
      <div className="relative aspect-[3/2] w-full">
        {image ? (
          <Image src={image} alt={imageAlt} fill sizes={imageSizes} className="object-cover" />
        ) : (
          <ImageFallback />
        )}
      </div>
      <div className="flex grow flex-col gap-2 p-5">
        {eyebrow && <div className="flex items-center gap-2">{eyebrow}</div>}
        <h3>
          <Link
            href={href}
            className="outline-none after:absolute after:inset-0 focus-visible:underline"
          >
            {title}
          </Link>
        </h3>
        {summary && <p className="line-clamp-2 text-sm text-ink-muted">{summary}</p>}
        {meta && <div className="text-micro text-ink-muted">{meta}</div>}
        {footer && <div className="mt-auto pt-3">{footer}</div>}
      </div>
    </article>
  )
}

export function SportCard(props: {
  href: string
  image?: string | null
  imageAlt?: string
  title: string
  summary: string
}) {
  return (
    <CardShell
      {...props}
      footer={<span className="text-sm font-medium text-river">Find out more</span>}
    />
  )
}

export function NewsCard({
  category,
  date,
  ...props
}: {
  href: string
  image?: string | null
  imageAlt?: string
  title: string
  summary?: string
  category?: string
  date: string
}) {
  return (
    <CardShell
      {...props}
      eyebrow={category ? <Badge variant="outline">{category}</Badge> : undefined}
      meta={<time>{date}</time>}
    />
  )
}

export function EventCard({
  category,
  when,
  location,
  status,
  ...props
}: {
  href: string
  image?: string | null
  imageAlt?: string
  title: string
  summary?: string
  category?: string
  when: string
  location?: string
  status?: React.ReactNode
}) {
  return (
    <CardShell
      {...props}
      eyebrow={category ? <Badge variant="outline">{category}</Badge> : undefined}
      meta={
        <>
          <time className="block">{when}</time>
          {location && <span className="block">{location}</span>}
        </>
      }
      footer={status}
    />
  )
}
