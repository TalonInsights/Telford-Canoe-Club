import type { Metadata } from 'next'
import Link from 'next/link'

import { PageHero } from '@/components/layout/page-hero'
import { Section } from '@/components/layout/section'
import { DocumentList } from '@/components/site/document-list'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Club role descriptions',
  description:
    'What each committee role involves — Telford Canoe Club has adopted the Paddle UK standard role descriptions.',
}

const UPLOADS = 'https://telfordcanoeclub.co.uk/wp-content/uploads/2026/05'

const roles = [
  { title: 'Chair', href: `${UPLOADS}/Chair-Role-Description-Paddle-England.docx.pdf` },
  { title: 'Treasurer', href: `${UPLOADS}/Treasurer-role-Description-Paddle-England.docx` },
  { title: 'Secretary', href: `${UPLOADS}/Secretary-Role-Description-Paddle-England-1.docx.pdf` },
  { title: 'Committee member', href: `${UPLOADS}/Commmittee-Member-Role-Description-Paddle-England-1.docx` },
  { title: 'Safety officer', href: `${UPLOADS}/Safety-Officer-Role-Description-Paddle-England.docx.pdf` },
  { title: 'Welfare officer', href: `${UPLOADS}/CWO-ROLE-AND-RESPONSIBILITIES.pdf` },
]

export default function RoleDescriptionsPage() {
  return (
    <>
      <PageHero
        title="Club role descriptions"
        intro="What each role involves — the club has adopted the Paddle UK standard descriptions."
        crumbs={[{ title: 'About', href: '/about' }]}
      />
      <Section tone="white">
        <div className="mx-auto w-full max-w-[720px]">
          <DocumentList
            documents={roles.map((r) => ({ ...r, note: 'Paddle UK standard description' }))}
          />
          <div className="mt-8 rounded-xl border border-river/40 bg-foam p-6">
            <h2 className="text-xl">Fancy one of these?</h2>
            <p className="mt-2 text-sm text-ink-muted">
              The club stays open because volunteers step up. If any of these roles looks like
              you — or you&apos;d like to coach — the committee would love to hear from you.
            </p>
            <Button asChild variant="secondary" className="mt-4">
              <Link href="/contact">Get in touch</Link>
            </Button>
          </div>
        </div>
      </Section>
    </>
  )
}
