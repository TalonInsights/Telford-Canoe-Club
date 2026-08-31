import Link from 'next/link'

import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { PaddleGlyph } from '@/components/site/image-fallback'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="flex grow items-center justify-center bg-foam px-4 py-section">
        <div className="max-w-md text-center">
          <PaddleGlyph className="mx-auto size-14 text-river" />
          <h1 className="mt-4">This page has drifted off downstream</h1>
          <p className="mt-3 text-ink-muted">
            The address might have changed when we rebuilt the site, or the page may never have
            existed. The river, happily, is exactly where it always is.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link href="/">Back to the home page</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/events">See what&apos;s on</Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
