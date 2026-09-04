import type { Metadata } from 'next'

import { PageHero } from '@/components/layout/page-hero'
import { Section } from '@/components/layout/section'

export const metadata: Metadata = {
  title: 'Privacy',
  description:
    'How Telford Canoe Club handles your personal information on this website — what we collect, why, how long we keep it, and your rights.',
}

function Block({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section className="mt-8 first:mt-0">
      <h2 className="text-xl">{heading}</h2>
      <div className="mt-2 space-y-3 text-ink-muted">{children}</div>
    </section>
  )
}

export default function PrivacyPage() {
  return (
    <>
      <PageHero
        title="Privacy"
        intro="What this website collects, why, and what happens to it. The club's full privacy policy document is on the policies page."
        crumbs={[{ title: 'About', href: '/about' }]}
      />
      <Section tone="white">
        <div className="mx-auto w-full max-w-[720px]">
          <Block heading="Who we are">
            <p>
              Telford Canoe Club, Jackfield Rapids, The Lloyds, Jackfield, Ironbridge, Telford
              TF8 7HJ. For anything about your data, email{' '}
              <a className="font-medium text-river underline-offset-4 hover:underline" href="mailto:committee@telfordcanoeclub.co.uk">
                committee@telfordcanoeclub.co.uk
              </a>
              .
            </p>
          </Block>
          <Block heading="What we collect, and why">
            <p>
              When you create an account or join the club we ask for your name, email address,
              date of birth, phone number, address, an emergency contact, and — for under-18s — a
              parent or guardian&apos;s details. We use this to run your membership, keep people
              safe on the water, and contact you about club activity. You can add your Paddle UK
              membership number so the club&apos;s affiliation records line up.
            </p>
            <p>
              Payment records (who paid, which tier, when and how) are kept so the committee can
              tell who is a current member. This site never sees or stores card details.
            </p>
          </Block>
          <Block heading="How long we keep it">
            <p>
              Membership records are kept for up to five years after your last membership ends,
              so returning members can be recognised and the club can meet its obligations. After
              that they are removed.
            </p>
          </Block>
          <Block heading="Cookies">
            <p>
              This site sets cookies only to keep you logged in. There is no advertising and no
              third-party tracking. Video embeds load only after you tap play, and use the
              providers&apos; privacy-enhanced players.
            </p>
          </Block>
          <Block heading="Who we share it with">
            <p>
              Nobody, beyond the services that run this site: our hosting and database providers
              store the data on the club&apos;s behalf in the UK/EU. The committee can see member
              records in order to run the club. We never sell or pass on your details.
            </p>
          </Block>
          <Block heading="Your rights">
            <p>
              You can see and edit your details any time from your profile. You can ask for an
              export of the personal data we hold about you, or ask us to delete it — email the
              committee and it will be actioned, except where the club is obliged to keep a
              record.
            </p>
          </Block>
          <p className="mt-8 text-micro text-ink-muted">
            This page describes the website. The club&apos;s formal privacy policy document (July
            2026) is available on the policies page and is being reviewed by the committee
            alongside the launch of this site.
          </p>
        </div>
      </Section>
    </>
  )
}
