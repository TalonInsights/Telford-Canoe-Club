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
import {
  getFacilities,
  getLatestPosts,
  getSiteSettings,
  getSportCards,
  getUpcomingEvents,
} from '@/lib/site-data'

/** Static with 15-minute revalidation — the EA level refreshes on the same cycle. */
export const revalidate = 900

export default async function HomePage() {
  const [settings, facilities, sports, events, posts] = await Promise.all([
    getSiteSettings(),
    getFacilities(),
    getSportCards(),
    getUpcomingEvents(3),
    getLatestPosts(3),
  ])

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
