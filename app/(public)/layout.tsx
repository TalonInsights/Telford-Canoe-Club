import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'

/**
 * Public-site chrome: skip link first in the DOM (§3.5 rule 4), sticky
 * header, main landmark, footer. Members/admin route groups will carry
 * their own shells.
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only z-50 rounded-lg bg-deep px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <Header />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
    </>
  )
}
