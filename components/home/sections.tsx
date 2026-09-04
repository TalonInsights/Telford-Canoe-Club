/**
 * HOME brief — the nine content sections in order, with the mandated tone
 * run: (hero deep · strip white ·) foam · white · foam · white · foam ·
 * white · deep · foam · deep. Copy uses only verified club facts from the
 * spec's migration inventory; unconfirmed material stays behind the
 * settings gates (HOME-04). Layouts reuse the three §3.4 shapes only.
 */

import {
  Bath,
  CalendarDays,
  Container as ContainerIcon,
  GraduationCap,
  SquareParking,
  Warehouse,
  Waves,
  type LucideIcon,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { FullGrid, Split75 } from '@/components/layout/grids'
import { Section } from '@/components/layout/section'
import { NewsCard, SportCard } from '@/components/site/cards'
import { CtaBand } from '@/components/site/cta-band'
import { FeatureCard } from '@/components/site/feature-card'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { formatDate, formatDateTimeRange, formatMoneyGBP } from '@/lib/format'
import type { Facility, HomeEvent, HomePost, SiteSettings, SportCard as Sport } from '@/lib/site-data'
import { IMAGES } from '@/lib/site-data'

/* 3 · The anomaly — foam */
export function Anomaly() {
  return (
    <Section tone="foam" kicker="The venue" title="A rapid where no rapid should be">
      <Split75
        side="right"
        media={
          <Image
            src={IMAGES.anomaly}
            alt="Whitewater breaking over the shelf at Jackfield Rapids"
            fill
            sizes="(min-width: 1024px) 480px, 100vw"
            className="object-cover"
          />
        }
      >
        <p>
          The Severn runs broad and quiet through most of Shropshire — then squeezes into the
          Ironbridge gorge and breaks into white water at Jackfield. That accident of geography
          gives a landlocked county something almost no club can offer: a paddleable rapid its
          members can call their own — gate, bank and car park included.
        </p>
        <p className="mt-4 text-ink-muted">
          Telford Canoe Club has paddled this stretch since the 1960s and has held the lease at
          Jackfield since 1987 — hosting forty national slaloms and fifteen river races along
          the way.
        </p>
        <Button asChild variant="secondary" className="mt-6">
          <Link href="/venue">More about the site</Link>
        </Button>
      </Split75>
    </Section>
  )
}

/* 4 · Inside the gate — white */
const facilityIcons: Record<string, LucideIcon> = {
  parking: SquareParking,
  toilets: Bath,
  containers: ContainerIcon,
  storage: Warehouse,
}

export function InsideTheGate({
  facilities,
  settings,
}: {
  facilities: Facility[]
  settings: SiteSettings
}) {
  const shown = facilities.filter((f) => f.confirmed || settings.showUnconfirmed)
  return (
    <Section
      tone="white"
      kicker="Facilities"
      title="Inside the gate"
      intro="A members' site on the bank of the Severn — built up over decades, looked after by the people who paddle here."
    >
      <FullGrid maxColumns={3}>
        {shown.map((f) => (
          <FeatureCard
            key={f.key}
            icon={facilityIcons[f.key] ?? ContainerIcon}
            title={f.title}
            body={f.description}
          />
        ))}
      </FullGrid>
    </Section>
  )
}

/* 5 · The rapid — foam */
export function TheRapid() {
  return (
    <Section tone="foam" kicker="The water" title="The rapid changes with the river">
      <Split75
        side="left"
        media={
          <Image
            src={IMAGES.rapid}
            alt="The Severn at Jackfield running high through the trees"
            fill
            sizes="(min-width: 1024px) 480px, 100vw"
            className="object-cover"
          />
        }
      >
        <p>
          The same stretch of water is a different place from one week to the next. Low water
          exposes the rocks and slows everything down; more flow and the waves build. Club
          evening paddles run when the levels are right — that&apos;s the river&apos;s call,
          not ours.
        </p>
        <p className="mt-4 text-ink-muted">
          The nearest gauge is the Environment Agency&apos;s at Buildwas, just upstream. The
          level in the strip above comes straight from it, updated through the day.
        </p>
        <Button asChild variant="secondary" className="mt-6">
          <Link href="/venue/river-levels">Reading the river levels</Link>
        </Button>
      </Split75>
    </Section>
  )
}

/* 6 · Paddle your way — white */
export function PaddleYourWay({ sports }: { sports: Sport[] }) {
  return (
    <Section
      tone="white"
      kicker="Disciplines"
      title="Paddle your way"
      intro="Three ways onto the water, one membership — club boats and kit included while you find your feet."
    >
      <FullGrid maxColumns={3}>
        {sports.map((s) => (
          <SportCard
            key={s.slug}
            href={`/paddlesports/${s.slug}`}
            image={s.image}
            imageAlt={s.imageAlt}
            title={s.title}
            summary={s.summary}
          />
        ))}
      </FullGrid>
    </Section>
  )
}

/* 7 · Sessions — foam */
const sessionCards = [
  {
    icon: Waves,
    title: 'Club evening paddles',
    body: 'Summer Thursdays, 5:30–9pm on our own water — levels permitting. Turn up, get changed, get on.',
  },
  {
    icon: Bath,
    title: 'Pool sessions',
    body: 'Warm-water skills through the colder months — rolling practice and boat handling.',
  },
  {
    icon: GraduationCap,
    title: 'Coaching and freestyle',
    body: 'Coached sessions across the year, from first strokes to playing the wave.',
  },
]

export function Sessions() {
  return (
    <Section
      tone="foam"
      kicker="Sessions"
      title="When we paddle"
      intro="Regular sessions through the year, shaped by the seasons and the river."
      action={
        <Button asChild variant="secondary">
          <Link href="/events">Session details</Link>
        </Button>
      }
    >
      <FullGrid maxColumns={3}>
        {sessionCards.map((s) => (
          <FeatureCard key={s.title} icon={s.icon} title={s.title} body={s.body} />
        ))}
      </FullGrid>
    </Section>
  )
}

/* 8 · What's on — white */
export function WhatsOn({ events }: { events: HomeEvent[] }) {
  return (
    <Section
      tone="white"
      kicker="Events"
      title="What's on"
      action={
        <Button asChild variant="secondary">
          <Link href="/events">All events</Link>
        </Button>
      }
    >
      {events.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Nothing scheduled just now"
          description="Check back soon — or join the club and hear about sessions first."
          action={
            <Button asChild variant="secondary">
              <Link href="/join">Join the club</Link>
            </Button>
          }
        />
      ) : (
        <FullGrid maxColumns={3}>
          {events.map((e) => (
            <div key={e.slug} className="flex h-full flex-col rounded-xl border border-stone bg-card p-5">
              <h3 className="text-lg">
                <Link href={`/events/${e.slug}`} className="hover:underline">
                  {e.title}
                </Link>
              </h3>
              <p className="mt-1 text-sm text-ink-muted">{formatDateTimeRange(e.startsAt)}</p>
              {e.location && <p className="mt-auto pt-2 text-micro text-ink-muted">{e.location}</p>}
            </div>
          ))}
        </FullGrid>
      )}
    </Section>
  )
}

/* 9 · Keeping the site open — deep */
export function KeepingSiteOpen() {
  return (
    <CtaBand
      spacing="default"
      kicker="Membership"
      title="A club that keeps its own gate open"
      intro="Having our own stretch of river is what makes this club special — and it stays ours because members keep it so. Membership fees and volunteer hands are what hold the lease and keep the gate open."
      primary={{ label: 'Become a member', href: '/join' }}
      secondary={{ label: 'Meet the committee', href: '/about/committee' }}
    />
  )
}

/* 10 · Latest news — foam */
export function LatestNews({ posts }: { posts: HomePost[] }) {
  return (
    <Section
      tone="foam"
      kicker="News"
      title="Latest from the club"
      action={
        <Button asChild variant="secondary">
          <Link href="/news">All news</Link>
        </Button>
      }
    >
      <FullGrid maxColumns={3}>
        {posts.map((p) => (
          <NewsCard
            key={p.slug}
            href={`/news/${p.slug}`}
            image={p.image}
            imageAlt={p.imageAlt}
            title={p.title}
            summary={p.excerpt}
            category={p.category ?? undefined}
            date={formatDate(p.publishedAt)}
          />
        ))}
      </FullGrid>
    </Section>
  )
}

/* 11 · Join band — deep */
export function JoinBand({ settings }: { settings: SiteSettings }) {
  return (
    <Section tone="deep" decor="arch" spacing="tight" title="Join Telford Canoe Club">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div>
          <p className="flex flex-wrap gap-x-6 gap-y-1 font-heading text-xl font-semibold">
            {settings.tiers.map((t) => (
              <span key={t.name}>
                {t.name}{' '}
                <span className="tabular-nums">{formatMoneyGBP(t.pricePence)}</span>
              </span>
            ))}
          </p>
          <p className="mt-1 text-sm text-stone">
            {settings.membershipYearLabel} · club boats and kit included
          </p>
        </div>
        <Button asChild variant="signal" size="lg">
          <Link href="/join">Join the club</Link>
        </Button>
      </div>
    </Section>
  )
}
