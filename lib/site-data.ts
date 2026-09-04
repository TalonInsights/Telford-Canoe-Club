/**
 * HOME-03 — typed seed getters, the only file edited for home content.
 * Every getter already returns the shape the Supabase queries will; when
 * lib/queries/* land (anon key pasted, Phase 2+), swap the bodies, never the
 * signatures. Facts here are sourced from the club's current site and the
 * build spec's migration inventory — nothing invented (acceptance H-05):
 * unconfirmed items ship switched OFF via the settings gates (HOME-04).
 */

export type SiteSettings = {
  siteStatus: 'open' | 'closed'
  siteStatusNote: string | null
  /** D2 open (Jan–Dec vs Apr–Mar) — neutral label until the committee settles it. */
  membershipYearLabel: string
  /** Hides the boat-storage facility card and any unconfirmed figures. */
  showUnconfirmed: boolean
  /**
   * D15 — when Simon supplies level bands the "Rapid today" cell labels the
   * water automatically. Example shape:
   * [{ maxMetres: 0.6, label: 'Low — rocky but paddleable' },
   *  { maxMetres: 1.1, label: 'Medium — the playful range' },
   *  { maxMetres: null, label: 'High — experienced paddlers only' }]
   */
  levelBands: { maxMetres: number | null; label: string }[] | null
  tiers: { name: string; pricePence: number }[]
}

export type Facility = {
  key: string
  title: string
  description: string
  confirmed: boolean
}

export type SportCard = {
  slug: string
  title: string
  summary: string
  image: string
  imageAlt: string
}

export type HomeEvent = {
  slug: string
  title: string
  category: string
  startsAt: string
  endsAt: string | null
  location: string | null
  summary: string | null
  /** Resolved URL (storage or bundled placeholder) — see lib/events/images.ts. */
  image: string | null
}

export type HomePost = {
  slug: string
  title: string
  excerpt: string
  publishedAt: string
  image: string | null
  imageAlt: string
  category: string | null
}

/** Local copies of the club's own photography (§9 map); originals from Simon replace these in place. */
export const IMAGES = {
  hero: '/images/placeholders/hero-jackfield.jpg',
  anomaly: '/images/placeholders/cover-02.jpg',
  rapid: '/images/placeholders/cover-03.jpg',
  whitewater: '/images/placeholders/ww-dee-wave.jpg',
  freestyle: '/images/placeholders/fs-hpp-air.jpg',
  sup: '/images/placeholders/sup-hero.jpg',
  newsFreestyle: '/images/placeholders/news-freestyle-2025.jpg',
} as const

export function getSiteSettings(): SiteSettings {
  return {
    siteStatus: 'open',
    siteStatusNote: null,
    membershipYearLabel: 'Annual membership',
    showUnconfirmed: false,
    levelBands: null,
    tiers: [
      { name: 'Adult', pricePence: 2500 },
      { name: 'Junior', pricePence: 1500 },
      { name: 'Family', pricePence: 4000 },
    ],
  }
}

export function getFacilities(): Facility[] {
  return [
    {
      key: 'parking',
      title: 'Parking on site',
      description: 'Drive in and unload by the water — the access road and parking were built for the club by army reserves.',
      confirmed: true,
    },
    {
      key: 'toilets',
      title: 'Toilets',
      description: 'On-site facilities, kept going by the members who use them.',
      confirmed: true,
    },
    {
      key: 'containers',
      title: 'Equipment containers',
      description: 'Club boats, paddles and safety kit live on site, ready for sessions.',
      confirmed: true,
    },
    {
      key: 'storage',
      title: 'Boat storage',
      description: 'Space for members to keep their own boats at the site.',
      confirmed: false,
    },
  ]
}

export function getSportCards(): SportCard[] {
  return [
    {
      slug: 'whitewater-kayaking',
      title: 'Whitewater kayaking',
      summary: 'Learn to read moving water on our own rapid, then join club trips further afield.',
      image: IMAGES.whitewater,
      imageAlt: 'Kayaker paddling a wave on the River Dee',
    },
    {
      slug: 'freestyle-kayaking',
      title: 'Freestyle kayaking',
      summary: 'Surfing, spinning and throwing ends — the playful side of whitewater, coached at club sessions.',
      image: IMAGES.freestyle,
      imageAlt: 'Freestyle kayaker mid-air at Holme Pierrepont',
    },
    {
      slug: 'paddleboarding',
      title: 'Paddleboarding',
      summary: 'Calmer water on quieter days — stand-up paddling for everyone from first-timers up.',
      image: IMAGES.sup,
      imageAlt: 'Paddleboarders on flat water',
    },
  ]
}

/** Empty until the events queries wire in — the empty state holds the layout. */
export function getUpcomingEvents(_limit = 3): HomeEvent[] {
  return []
}

export function getNextOnSite(): HomeEvent | null {
  return null
}

/** The three real posts from the current site (§10.1). */
export function getLatestPosts(_limit = 3): HomePost[] {
  return [
    {
      slug: 'paddle-uk-club-membership',
      title: 'Paddle UK club membership',
      excerpt: 'Members are asked to update their JustGo profiles so the club’s Paddle UK affiliation records stay accurate.',
      publishedAt: '2026-05-23',
      image: null,
      imageAlt: '',
      category: 'Club news',
    },
    {
      slug: 'tcc-committee',
      title: 'TCC committee',
      excerpt: 'On keeping the committee viable, the roles that need filling — and thanks to Iain for his years of service.',
      publishedAt: '2026-04-18',
      image: null,
      imageAlt: '',
      category: 'Club news',
    },
    {
      slug: 'freestyle-coaching-jackfield-matt-stephenson',
      title: 'Freestyle coaching at Jackfield with Matt Stephenson',
      excerpt: 'A coached freestyle session on our own wave with GB freestyle paddler Matt Stephenson.',
      publishedAt: '2025-08-09',
      image: IMAGES.newsFreestyle,
      imageAlt: 'Freestyle kayaker playing the wave at Jackfield',
      category: 'Coaching',
    },
  ]
}
