import type { Metadata } from 'next'
import Link from 'next/link'

import { PageHero } from '@/components/layout/page-hero'
import { Section } from '@/components/layout/section'
import { DocumentList } from '@/components/site/document-list'

export const metadata: Metadata = {
  title: 'Club policies',
  description:
    'Telford Canoe Club policies and governing documents — constitution, safeguarding, health and safety, code of conduct and more, largely adopted from the Paddle UK club framework.',
}

const UPLOADS = 'https://telfordcanoeclub.co.uk/wp-content/uploads/2026/08'

const policies = [
  { title: 'Welcome pack', href: `${UPLOADS}/Welcome-pack-Jul-26.pdf`, note: 'Start here — July 2026' },
  { title: 'Constitution', href: `${UPLOADS}/TCC-Constitution-2023.pdf`, note: '2023' },
  { title: 'Standard operating procedures', href: `${UPLOADS}/Standard-Operating-Procedures.pdf` },
  { title: 'Safeguarding and welfare policy', href: `${UPLOADS}/Safeguarding-Welfare-policy.pdf` },
  { title: 'Code of conduct', href: `${UPLOADS}/Club-Code-of-Conduct-Jul26.pdf`, note: 'July 2026' },
  { title: 'Health and safety policy', href: `${UPLOADS}/Club-Health-and-Safety-Policy-July26.pdf`, note: 'July 2026' },
  { title: 'Privacy policy', href: `${UPLOADS}/Privacy-policy-July26.pdf`, note: 'July 2026 — see also the website privacy page' },
  { title: 'Equality policy', href: `${UPLOADS}/Equality-Policy.pdf` },
  { title: 'Risk assessment — Jackfield', href: `${UPLOADS}/TCC-Risk-Assessment-Jackfield.pdf` },
]

export default function PoliciesPage() {
  return (
    <>
      <PageHero
        title="Club policies"
        intro="The documents that govern how the club runs — most adopted from the Paddle UK club framework."
        crumbs={[{ title: 'About', href: '/about' }]}
      />
      <Section tone="white">
        <div className="mx-auto w-full max-w-[720px]">
          <DocumentList documents={policies} />
          <p className="mt-6 text-sm text-ink-muted">
            Questions about any policy? Email{' '}
            <a
              href="mailto:committee@telfordcanoeclub.co.uk"
              className="font-medium text-river underline-offset-4 hover:underline"
            >
              committee@telfordcanoeclub.co.uk
            </a>{' '}
            or see the{' '}
            <Link href="/about/committee" className="font-medium text-river underline-offset-4 hover:underline">
              committee page
            </Link>
            .
          </p>
        </div>
      </Section>
    </>
  )
}
