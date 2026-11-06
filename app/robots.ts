import type { MetadataRoute } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://telfordcanoeclub.co.uk'

/**
 * P2-23 launch toggle. Search engines are opened up ONLY on the production
 * domain; preview and staging deployments stay fully disallowed so a Vercel
 * preview URL can never be indexed. On production the public pages are allowed,
 * the members area, admin, checkout, auth, API and dev proving grounds are kept
 * out of search, and crawlers are pointed at the sitemap.
 */
export default function robots(): MetadataRoute.Robots {
  if (process.env.VERCEL_ENV !== 'production') {
    return { rules: { userAgent: '*', disallow: '/' } }
  }
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/members',
        '/checkout',
        '/api',
        '/welcome',
        '/login',
        '/register',
        '/reset-password',
        '/forgot-password',
        '/verify',
        '/unsubscribe',
        '/dev',
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  }
}
