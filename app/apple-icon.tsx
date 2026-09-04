import { ImageResponse } from 'next/og'

import { OgBadge } from '@/components/site/brand-og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

/** DR-02 — home-screen icon: the badge in white on the deep field. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0e2f3c',
        }}
      >
        <OgBadge size={150} />
      </div>
    ),
    size
  )
}
