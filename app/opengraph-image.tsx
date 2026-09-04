import { ImageResponse } from 'next/og'

import { OgBadge } from '@/components/site/brand-og'

export const alt = 'Telford Canoe Club — whitewater, freestyle and paddleboarding on the Severn at Jackfield Rapids, Ironbridge'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/**
 * DR-02 — the share card: badge on the deep field, wordmark and the one-line
 * pitch. Tokens are inlined because satori cannot read CSS variables.
 */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          padding: '0 96px',
          background: 'linear-gradient(135deg, #0e2f3c 0%, #143f4e 100%)',
          color: '#ffffff',
        }}
      >
        <OgBadge size={300} />
        <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 72, maxWidth: 680 }}>
          <div style={{ fontSize: 72, fontWeight: 700, letterSpacing: -1.5, lineHeight: 1.05 }}>
            Telford Canoe Club
          </div>
          <div style={{ marginTop: 24, fontSize: 30, lineHeight: 1.35, color: '#dce3e1' }}>
            Whitewater, freestyle and paddleboarding on our own stretch of the Severn — Jackfield
            Rapids, Ironbridge.
          </div>
          <div
            style={{
              marginTop: 36,
              display: 'flex',
              alignItems: 'center',
              fontSize: 22,
              color: '#dce3e1',
            }}
          >
            <div style={{ width: 12, height: 12, borderRadius: 6, background: '#c93518', marginRight: 14 }} />
            An affiliated Paddle UK club
          </div>
        </div>
      </div>
    ),
    size
  )
}
