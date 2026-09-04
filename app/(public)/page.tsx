import { Hero } from '@/components/home/hero'
import {
  Anomaly,
  InsideTheGate,
  JoinBand,
  KeepingSiteOpen,
  LatestNews,
  PaddleYourWay,
  Sessions,
  TheRapid,
  WhatsOn,
} from '@/components/home/sections'
import { StatusStrip } from '@/components/home/status-strip'
import { eventImageUrl } from '@/lib/events/images'
import { getUpcomingEvents } from '@/lib/queries/events'
import { getClubSettings } from '@/lib/queries/settings'
import { getFacilities, getLatestPosts, getSportCards } from '@/lib/site-data'

/** Static with 15-minute revalidation — the EA level refreshes on the same cycle. */
export const revalidate = 900

export default async function HomePage() {
  const [settings, rawEvents] = await Promise.all([getClubSettings(), getUpcomingEvents(3)])
  const facilities = getFacilities()
  const sports = getSportCards()
  const posts = getLatestPosts(3)
  const events = rawEvents.map((e) => ({
    slug: e.slug,
    title: e.title,
    category: e.category,
    startsAt: e.starts_at,
    endsAt: e.ends_at,
    location: e.location_name,
    summary: e.summary,
    image: eventImageUrl(e.cover_image_path),
  }))

  return (
    <>
      <Hero />
      <StatusStrip />
      <Anomaly />
      <InsideTheGate facilities={facilities} settings={settings} />
      <TheRapid />
      <PaddleYourWay sports={sports} />
      <Sessions />
      <WhatsOn events={events} />
      <KeepingSiteOpen />
      <LatestNews posts={posts} />
      <JoinBand settings={settings} />
    </>
  )
}
