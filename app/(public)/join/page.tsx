import type { Metadata } from 'next'
import Link from 'next/link'

import { FullGrid } from '@/components/layout/grids'
import { PageHero } from '@/components/layout/page-hero'
import { Section } from '@/components/layout/section'
import { CtaBand } from '@/components/site/cta-band'
import { FaqAccordion } from '@/components/site/faq-accordion'
import { FeatureCard } from '@/components/site/feature-card'
import { PricingTiers } from '@/components/site/pricing-tiers'
import { Button } from '@/components/ui/button'
import { isOnlinePaymentOn } from '@/lib/payments/mode'
import { getClubSettings } from '@/lib/queries/settings'
import { IMAGES } from '@/lib/site-data'

export const metadata: Metadata = {
  title: 'Join the club',
  description:
    'Membership of Telford Canoe Club — adult, junior and family tiers, club boats and kit included, on our own stretch of the Severn.',
}

export const revalidate = 900

export default async function JoinPage() {
  const settings = await getClubSettings()
  const [adult, junior, family] = settings.tiers
  const onlineOn = isOnlinePaymentOn(settings.paymentProvider)

  return (
    <>
      <PageHero
        title="Join Telford Canoe Club"
        intro="One membership, every discipline — and your own stretch of the Severn to paddle."
        image={IMAGES.anomaly}
        imageAlt="Paddlers enjoying the water at Jackfield"
      />
      <Section
        tone="white"
        title="Choose your membership"
        intro={`${settings.membershipYearLabel} · the same price whenever you join`}
      >
        <PricingTiers
          yearNote={settings.membershipYearLabel}
          tiers={[
            {
              name: 'Single adult',
              pricePence: adult.pricePence,
              description: 'For paddlers aged 18 and over.',
              features: ['All club sessions', 'Club boats and kit while you learn', 'Members-only area and notices'],
              href: '/register?tier=adult',
              cta: 'Join as an adult',
            },
            {
              name: 'Single junior',
              pricePence: junior.pricePence,
              description: 'Under-18 membership, with a parent or guardian on record.',
              features: ['All junior-friendly sessions', 'Club boats and kit', 'Freestyle and coaching pathways'],
              href: '/register?tier=junior',
              cta: 'Join as a junior',
            },
            {
              name: 'Family',
              pricePence: family.pricePence,
              description: 'For members residing at the same address.',
              features: ['Everyone at your address covered', 'One renewal for the household', 'Best value for families'],
              href: '/register?tier=family',
              cta: 'Join as a family',
            },
          ]}
        />
      </Section>
      <Section tone="foam" title="How joining works">
        <FullGrid maxColumns={3}>
          {[
            {
              title: 'Create your account',
              body: 'Register with your details — under-18s add a parent or guardian. It takes about two minutes.',
            },
            {
              title: 'Choose your tier',
              body: 'Pick adult, junior or family from your account. Family memberships list everyone at your address.',
            },
            onlineOn
              ? {
                  title: 'Pay your way',
                  body: 'Pay online and your membership activates instantly — or pay the treasurer by bank transfer or cash and the committee confirms it as soon as it lands.',
                }
              : {
                  title: 'Pay the treasurer',
                  body: 'Online card payment is on its way. For now pay by bank transfer or cash, and the committee confirms your membership as soon as it lands.',
                },
          ].map((s, i) => (
            <FeatureCard key={s.title} step={i + 1} title={s.title} body={s.body} />
          ))}
        </FullGrid>
        <div className="mt-8">
          <Button asChild variant="signal" size="lg">
            <Link href="/register">Create your account</Link>
          </Button>
        </div>
      </Section>
      <Section tone="white">
        <FaqAccordion
          title="Common questions"
          intro="The things new members usually ask before their first paddle."
          faqs={[
            {
              question: 'Do I need my own kayak or board?',
              answer:
                'No — club boats, paddles and buoyancy aids are available for members at sessions while you find your feet. Most people buy their own kit once they know what they like.',
            },
            {
              question: 'What does membership include?',
              answer:
                'All club sessions across every discipline, use of club equipment at sessions, the members-only area of this site (including site access details), and being part of a club affiliated to Paddle UK.',
            },
            {
              question: 'How does the family membership work?',
              answer:
                'Family membership covers members residing at the same address — list everyone when you choose the tier and the whole household is covered by one renewal.',
            },
            {
              question: 'Can under-18s join?',
              answer:
                'Yes — juniors are a big part of the club. A parent or guardian goes on record during registration, and our safeguarding and welfare policy applies to everything we run.',
            },
            {
              question: 'What about Paddle UK membership?',
              answer:
                'Club membership and Paddle UK membership are separate. If you hold Paddle UK membership, add the club on your JustGo profile and pop your number in your TCC profile — it genuinely helps the club with affiliation.',
            },
            onlineOn
              ? {
                  question: 'How do I pay?',
                  answer:
                    'Two ways: pay online from your account and your membership activates instantly, or pay the treasurer by bank transfer or cash — the committee records it and your membership goes active.',
                }
              : {
                  question: 'How do I pay right now?',
                  answer:
                    'Card payment through the site is coming. Until it arrives: request your tier from your account, then pay the treasurer by bank transfer or cash — the committee records it and your membership goes active.',
                },
          ]}
        />
      </Section>
      <CtaBand
        title="The river is waiting"
        intro="Two minutes to register, one payment, and Jackfield is yours to paddle."
        primary={{ label: 'Create your account', href: '/register' }}
        secondary={{ label: 'Ask us anything first', href: '/contact' }}
      />
    </>
  )
}
