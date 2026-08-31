import type { Metadata } from 'next'
import { Mail, MapPin, Users } from 'lucide-react'

import { PageHero } from '@/components/layout/page-hero'
import { Section } from '@/components/layout/section'
import { ContactForm } from '@/components/site/contact-form'

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Get in touch with Telford Canoe Club — questions about joining, sessions, coaching or the Jackfield site.',
}

export default function ContactPage() {
  return (
    <>
      <PageHero
        title="Contact"
        intro="Questions about joining, sessions, coaching or the site — the committee reads everything."
      />
      <Section tone="white">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <dl className="space-y-5">
              <div className="flex items-start gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-foam">
                  <Mail className="size-5 text-river" aria-hidden="true" />
                </span>
                <div>
                  <dt className="font-medium">Email the committee</dt>
                  <dd className="text-sm text-ink-muted">
                    <a
                      href="mailto:committee@telfordcanoeclub.co.uk"
                      className="font-medium text-river underline-offset-4 hover:underline"
                    >
                      committee@telfordcanoeclub.co.uk
                    </a>{' '}
                    — the quickest way to reach us.
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-foam">
                  <MapPin className="size-5 text-river" aria-hidden="true" />
                </span>
                <div>
                  <dt className="font-medium">Find us</dt>
                  <dd className="text-sm text-ink-muted">
                    Jackfield Rapids, The Lloyds, Jackfield, Ironbridge, Telford TF8 7HJ
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-foam">
                  <Users className="size-5 text-river" aria-hidden="true" />
                </span>
                <div>
                  <dt className="font-medium">Better in person?</dt>
                  <dd className="text-sm text-ink-muted">
                    Come along to a club evening in season — someone will always talk paddling
                    with you.
                  </dd>
                </div>
              </div>
            </dl>
          </div>
          <div className="lg:col-span-7">
            <ContactForm />
          </div>
        </div>
      </Section>
    </>
  )
}
