import type { Metadata } from 'next'
import Link from 'next/link'

import { PageHero } from '@/components/layout/page-hero'
import { Section } from '@/components/layout/section'
import { CommitteeGrid } from '@/components/site/committee-grid'
import { Button } from '@/components/ui/button'
import { getCommitteeRoles } from '@/lib/queries/committee'

export const metadata: Metadata = {
  title: 'Committee',
  description:
    'The volunteers who run Telford Canoe Club — the 2026 committee, in role until the September AGM.',
}

export const revalidate = 900

export default async function CommitteePage() {
  const roles = await getCommitteeRoles()
  return (
    <>
      <PageHero
        title="Committee"
        intro="The 2026 committee, in role from April until the next AGM in September."
      />
      <Section tone="white">
        <CommitteeGrid
          roles={roles.map((r) => ({
            roleTitle: r.role_title,
            holderName: r.holder_display_name,
            description: r.description ?? undefined,
            contactEmail: r.contact_email,
          }))}
        />
      </Section>
      <Section
        tone="foam"
        spacing="tight"
        title="Could you help take the club forward?"
        intro="Anyone with an interest in the club's future — on the committee or coaching — is warmly encouraged to come forward. Roles follow the Paddle UK standard descriptions."
      >
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="secondary">
            <Link href="/about/role-descriptions">Read the role descriptions</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/contact">Talk to us</Link>
          </Button>
        </div>
      </Section>
    </>
  )
}
