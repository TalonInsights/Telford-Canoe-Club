import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'

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
      <main id="main" className="flex flex-1 items-start justify-center bg-foam px-4 py-section-tight">
        {children}
      </main>
      <Footer />
    </>
  )
}
