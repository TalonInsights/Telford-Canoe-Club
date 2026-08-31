import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    // Placeholder photography can also load straight from the club's current
    // WordPress uploads (HOME brief §5) until Simon's originals arrive.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'telfordcanoeclub.co.uk',
        pathname: '/wp-content/uploads/**',
      },
    ],
  },
}

export default nextConfig
