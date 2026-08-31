import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    // Placeholder photography can also load straight from the club's current
    // WordPress uploads until Simon's originals arrive.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'telfordcanoeclub.co.uk',
        pathname: '/wp-content/uploads/**',
      },
    ],
  },
  // §10.4 — every old-site URL keeps working (P12-01, brought forward).
  async redirects() {
    return [
      { source: '/paddlesports/standup-paddleboard-sup', destination: '/paddlesports/paddleboarding', permanent: true },
      { source: '/about/committee-meetings', destination: '/members/documents', permanent: true },
      { source: '/about/agm', destination: '/members/documents', permanent: true },
      { source: '/club-role-descriptions', destination: '/about/role-descriptions', permanent: true },
      { source: '/about/tcc-policies', destination: '/about/policies', permanent: true },
      { source: '/about/privacy-policy', destination: '/about/privacy', permanent: true },
      { source: '/latest-news', destination: '/news', permanent: true },
      { source: '/events/locations', destination: '/events', permanent: true },
      { source: '/events/categories', destination: '/events', permanent: true },
      { source: '/events/tags', destination: '/events', permanent: true },
      { source: '/events/my-bookings', destination: '/members/events', permanent: true },
      { source: '/membership', destination: '/join', permanent: true },
      { source: '/membership/20-2', destination: '/register', permanent: true },
      { source: '/membership/login', destination: '/login', permanent: true },
      { source: '/membership/forgot_password', destination: '/forgot-password', permanent: true },
      { source: '/membership/edit_profile', destination: '/members/profile', permanent: true },
      { source: '/category/:slug*', destination: '/news', permanent: true },
      { source: '/paddle-uk-club-membership', destination: '/news/paddle-uk-club-membership', permanent: true },
      { source: '/tcc-committee', destination: '/news/tcc-committee', permanent: true },
      { source: '/freestyle-coaching-at-jackfield-with-matt-stephenson', destination: '/news/freestyle-coaching-jackfield-matt-stephenson', permanent: true },
      // New-IA aliases used by early home-page builds.
      { source: '/the-site', destination: '/venue', permanent: false },
      { source: '/the-site/river-levels', destination: '/venue/river-levels', permanent: false },
      { source: '/sessions', destination: '/events', permanent: false },
      { source: '/paddle-here', destination: '/paddlesports', permanent: false },
    ]
  },
}

export default nextConfig
