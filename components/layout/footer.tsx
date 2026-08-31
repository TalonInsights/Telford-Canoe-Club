/**
 * P0-07 — column pattern from 21st.dev "Footer column"
 * (https://21st.dev/@mvp_Subha/components/footer-column, MIT), rebuilt on TCC
 * tokens: deep tone, stone secondary text (10.8:1), address + affiliation +
 * policies, role aliases only — no personal email addresses.
 */

import Link from 'next/link'

import { Container } from '@/components/layout/container'
import { PaddleGlyph } from '@/components/site/image-fallback'

const explore = [
  { title: 'Paddlesports', href: '/paddlesports' },
  { title: 'Events', href: '/events' },
  { title: 'News', href: '/news' },
  { title: 'Venue', href: '/venue' },
  { title: 'About the club', href: '/about' },
]

const membership = [
  { title: 'Join the club', href: '/join' },
  { title: 'Log in', href: '/login' },
  { title: 'Committee', href: '/about/committee' },
  { title: 'Contact', href: '/contact' },
]

const policies = [
  { title: 'Club policies', href: '/about/policies' },
  { title: 'Privacy', href: '/about/privacy' },
  { title: 'Role descriptions', href: '/about/role-descriptions' },
]

function FooterColumn({ title, links }: { title: string; links: { title: string; href: string }[] }) {
  return (
    <nav aria-label={title}>
      <h2 className="text-lg text-white">{title}</h2>
      <ul className="mt-3 space-y-1">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="inline-flex min-h-9 items-center text-sm text-stone transition-colors hover:text-white"
            >
              {l.title}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export function Footer() {
  return (
    <footer className="bg-deep text-white">
      <Container>
        <div className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2.5 font-heading text-lg font-semibold">
              <PaddleGlyph className="size-7" />
              Telford Canoe Club
            </div>
            <address className="mt-3 text-sm text-stone not-italic">
              Jackfield Rapids
              <br />
              The Lloyds, Jackfield
              <br />
              Ironbridge, Telford TF8 7HJ
            </address>
            <p className="mt-3 text-sm text-stone">
              Committee:{' '}
              <a href="mailto:committee@telfordcanoeclub.co.uk" className="underline-offset-4 hover:underline">
                committee@telfordcanoeclub.co.uk
              </a>
            </p>
          </div>
          <FooterColumn title="Explore" links={explore} />
          <FooterColumn title="Membership" links={membership} />
          <FooterColumn title="Policies" links={policies} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-river/60 py-6 text-micro text-stone">
          <p>© {new Date().getFullYear()} Telford Canoe Club. An affiliated Paddle UK club.</p>
          <p>Site by Talon Insights</p>
        </div>
      </Container>
    </footer>
  )
}
