import { getEventBySlug } from '@/lib/queries/events'

export const revalidate = 900

function icsDate(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function esc(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params
  const event = await getEventBySlug(slug)
  if (!event || event.status !== 'published') {
    return new Response('Not found', { status: 404 })
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://telford-canoe-club.vercel.app'
  const end = event.ends_at ?? new Date(+new Date(event.starts_at) + 2 * 3600_000).toISOString()
  const location = [event.location_name, event.location_address].filter(Boolean).join(', ')

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Telford Canoe Club//Events//EN',
    'BEGIN:VEVENT',
    `UID:${event.id}@telfordcanoeclub.co.uk`,
    `DTSTAMP:${icsDate(new Date().toISOString())}`,
    `DTSTART:${icsDate(event.starts_at)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${esc(event.title)}`,
    event.summary ? `DESCRIPTION:${esc(event.summary)}` : null,
    location ? `LOCATION:${esc(location)}` : null,
    `URL:${site}/events/${event.slug}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean)

  return new Response(lines.join('\r\n'), {
    headers: {
      'content-type': 'text/calendar; charset=utf-8',
      'content-disposition': `attachment; filename="${event.slug}.ics"`,
    },
  })
}
