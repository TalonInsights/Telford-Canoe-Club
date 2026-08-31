import type { MetadataRoute } from 'next'

/**
 * Pre-launch stance: keep the work-in-progress site out of search results.
 * P2-23 opens this up (allow + sitemap) as part of the launch checklist.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', disallow: '/' },
  }
}
