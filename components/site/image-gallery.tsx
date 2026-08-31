'use client'

/**
 * P0-16 — grid + lightbox pattern from 21st.dev "Gallery Grid with Lightbox"
 * (https://21st.dev/@moumensoliman/components/gallery-grid-block-shadcnui,
 * MIT; hover/accordion galleries rejected as gimmicks). Rebuilt: 3:2 tiles on
 * FullGrid, radix Dialog lightbox (Escape + focus handled), previous/next by
 * button and arrow key, lazy images, and a click-to-load video-embed tile —
 * no third-party cookies until the visitor opts in (§3.5 rule 10).
 */

import { ChevronLeft, ChevronRight, Play } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'

import { FullGrid } from '@/components/layout/grids'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'

export type GalleryItem =
  | { kind: 'image'; src: string; alt: string; caption?: string }
  | { kind: 'video'; embedUrl: string; title: string; thumbnail?: string }

function videoSrc(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{6,})/)
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}?autoplay=1`
  const vimeo = url.match(/vimeo\.com\/(\d+)/)
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}?autoplay=1&dnt=1`
  return null
}

function VideoTile({ item }: { item: Extract<GalleryItem, { kind: 'video' }> }) {
  const [loaded, setLoaded] = useState(false)
  const src = videoSrc(item.embedUrl)
  if (!src) return null
  return (
    <div className="relative aspect-[3/2] overflow-hidden rounded-xl border border-stone bg-deep">
      {loaded ? (
        <iframe
          src={src}
          title={item.title}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      ) : (
        <button
          type="button"
          onClick={() => setLoaded(true)}
          className="group absolute inset-0 flex flex-col items-center justify-center gap-2 text-white"
        >
          {item.thumbnail && (
            <Image
              src={item.thumbnail}
              alt=""
              fill
              sizes="(min-width: 1024px) 384px, 100vw"
              className="object-cover opacity-60"
            />
          )}
          <span className="relative flex size-14 items-center justify-center rounded-full bg-signal transition-transform group-hover:scale-105">
            <Play aria-hidden="true" className="size-6 fill-current" />
          </span>
          <span className="relative px-4 text-center text-sm font-medium">
            Play: {item.title}
          </span>
          <span className="relative text-micro text-stone">Loads YouTube/Vimeo when tapped</span>
        </button>
      )}
    </div>
  )
}

export function ImageGallery({ items }: { items: GalleryItem[] }) {
  const images = items.filter((i) => i.kind === 'image')
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const step = (dir: 1 | -1) =>
    setOpenIndex((i) => (i === null ? i : (i + dir + images.length) % images.length))

  return (
    <>
      <FullGrid maxColumns={3}>
        {items.map((item, idx) =>
          item.kind === 'video' ? (
            <VideoTile key={`v-${idx}`} item={item} />
          ) : (
            <button
              key={item.src}
              type="button"
              onClick={() => setOpenIndex(images.indexOf(item))}
              className="group relative block aspect-[3/2] w-full overflow-hidden rounded-xl border border-stone focus-visible:border-river"
              aria-label={`View larger: ${item.alt}`}
            >
              <Image
                src={item.src}
                alt={item.alt}
                fill
                loading="lazy"
                sizes="(min-width: 1024px) 384px, (min-width: 640px) 50vw, 100vw"
                className="object-cover transition-transform duration-200 group-hover:scale-[1.02]"
              />
            </button>
          )
        )}
      </FullGrid>

      <Dialog open={openIndex !== null} onOpenChange={(o) => !o && setOpenIndex(null)}>
        <DialogContent
          className="max-w-4xl border-none bg-deep p-2 text-white sm:p-3"
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') step(1)
            if (e.key === 'ArrowLeft') step(-1)
          }}
        >
          {openIndex !== null && images[openIndex] && (
            <figure>
              <DialogTitle className="sr-only">{images[openIndex].alt}</DialogTitle>
              <div className="relative aspect-[3/2] w-full overflow-hidden rounded-lg">
                <Image
                  src={images[openIndex].src}
                  alt={images[openIndex].alt}
                  fill
                  sizes="(min-width: 1024px) 896px, 100vw"
                  className="object-contain"
                />
              </div>
              <figcaption className="flex items-center justify-between gap-2 pt-2">
                <span className="text-sm text-stone">
                  {images[openIndex].caption ?? images[openIndex].alt}
                </span>
                <span className="flex items-center gap-1">
                  <span className="pr-1 text-micro text-stone tabular-nums">
                    {openIndex + 1} / {images.length}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Previous image"
                    className="text-white hover:bg-river hover:text-white"
                    onClick={() => step(-1)}
                  >
                    <ChevronLeft />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Next image"
                    className="text-white hover:bg-river hover:text-white"
                    onClick={() => step(1)}
                  >
                    <ChevronRight />
                  </Button>
                </span>
              </figcaption>
            </figure>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
