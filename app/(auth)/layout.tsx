import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { AuthPanel } from '@/components/site/auth-panel'

/**
 * Auth shell (DR-07): brand panel beside the form at ≥1024px, a brand strip
 * above it below that. Every auth page — login, register, welcome, forgot,
 * reset, verify — renders its own card into the form column unchanged.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only z-50 rounded-lg bg-deep px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <Header />
      <main id="main" className="flex flex-1 flex-col bg-foam lg:flex-row">
        <AuthPanel />
        <div className="flex flex-1 items-start justify-center px-4 py-section-tight md:px-6">
          {children}
        </div>
      </main>
      <Footer />
    </>
  )
}
