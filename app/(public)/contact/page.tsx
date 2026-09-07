import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowUpRight, Mail, MapPin, Users } from 'lucide-react'

import { PageHero } from '@/components/layout/page-hero'
import { Section } from '@/components/layout/section'
import { ContactForm } from '@/components/site/contact-form'
import { CtaBand } from '@/components/site/cta-band'
import { Button } from '@/components/ui/button'
import { IMAGES } from '@/lib/site-data'

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Get in touch with Telford Canoe Club — questions about joining, sessions, coaching or the Jackfield site.',
}

const ADDRESS = 'Jackfield Rapids, The Lloyds, Jackfield, Ironbridge, Telford TF8 7HJ'
const MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADDRESS)}`

function Way({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-4">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-card">
        <Icon className="size-5 text-river" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <dt className="font-heading text-lg font-semibold">{title}</dt>
        <dd className="mt-1 text-sm text-ink-muted">{children}</dd>
      </div>
    </div>
  )
}

export default function ContactPage() {
  return (
    <>
      <PageHero
        title="Contact"
        intro="Questions about joining, sessions, coaching or the site — the committee reads everything."
        image={IMAGES.sup}
        imageAlt="Paddleboarders on calm water"
      />
      <Section
        tone="white"
        kicker="Get in touch"
        title="Talk to the committee"
        intro="Volunteers run the club, so allow a few days for a reply — but every message is read and answered."
      >
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch">
          <div className="lg:col-span-5">
            <div className="flex h-full flex-col rounded-xl border border-stone bg-foam p-6">
              <dl className="space-y-6">
                <Way icon={Mail} title="Email the committee">
                  <a
                    href="mailto:committee@telfordcanoeclub.co.uk"
                    className="font-medium text-river underline-offset-4 hover:underline"
                  >
                    committee@telfordcanoeclub.co.uk
                  </a>
                  <span className="block">The quickest way to reach us.</span>
                </Way>
                <Way icon={MapPin} title="Find us">
                  <span className="block">{ADDRESS}</span>
                  <a
                    href={MAPS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1 font-medium text-river underline-offset-4 hover:underline"
                  >
                    Open in Google Maps <ArrowUpRight aria-hidden="true" className="size-3.5" />
                  </a>
                </Way>
                <Way icon={Users} title="Better in person?">
                  Come along to a club evening in season — someone will always talk paddling with
                  you.{' '}
                  <Link
                    href="/events"
                    className="font-medium text-river underline-offset-4 hover:underline"
                  >
                    See when we paddle
                  </Link>
                  .
                </Way>
              </dl>
              <div className="mt-auto border-t border-stone pt-6">
                <p className="text-sm text-ink-muted">
                  Looking for a particular person? The committee page lists every role and who
                  holds it.
                </p>
                <Button asChild variant="outline" size="sm" className="mt-3">
                  <Link href="/about/committee">Meet the committee</Link>
                </Button>
              </div>
            </div>
          </div>
          <div className="lg:col-span-7">
            <div className="h-full rounded-xl border border-stone bg-card p-6 sm:p-8">
              <h3 className="text-xl">Send a message</h3>
              <p className="mt-1 text-sm text-ink-muted">
                We reply by email. Nothing you write here is shared beyond the committee.
              </p>
              <div className="mt-5">
                <ContactForm />
              </div>
            </div>
          </div>
        </div>
      </Section>
      <CtaBand
        title="Rather see the river first?"
        intro="No membership needed to come and say hello — club evenings run through the season at Jackfield, levels permitting."
        primary={{ label: 'Join the club', href: '/join' }}
        secondary={{ label: "See what's on", href: '/events' }}
      />
    </>
  )
}
