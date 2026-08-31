import type { MetadataRoute } from 'next'

import { newsPosts } from '@/lib/content/news'
import { getPublishedEvents } from '@/lib/queries/events'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://telford-canoe-club.vercel.app'
  const events = await getPublishedEvents()

  const fixed = [
    '',
    '/paddlesports',
    '/paddlesports/whitewater-kayaking',
    '/paddlesports/freestyle-kayaking',
    '/paddlesports/paddleboarding',
    '/about',
    '/about/committee',
    '/about/role-descriptions',
    '/about/policies',
    '/about/privacy',
    '/venue',
    '/venue/river-levels',
    '/events',
    '/news',
    '/join',
    '/contact',
  ]

  return [
    ...fixed.map((path) => ({ url: `${base}${path}` })),
    ...events.map((e) => ({ url: `${base}/events/${e.slug}` })),
    ...newsPosts.map((p) => ({ url: `${base}/news/${p.slug}` })),
  ]
}
