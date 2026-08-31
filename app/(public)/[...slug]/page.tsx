import Link from 'next/link'

import { PageHero } from '@/components/layout/page-hero'
import { Button } from '@/components/ui/button'

/**
 * HOME-06 — shared placeholder so no home-page link 404s while the real
 * routes are built. Each real route that lands takes precedence over this
 * catch-all automatically; delete the file once the site map is done.
 * Chrome (header/skip link/footer) comes from the (public) layout.
 */

export const dynamic = 'force-static'

export default async function PlaceholderPage({
  params,
}: {
  params: Promise<{ slug: string[] }>
}) {
  const { slug } = await params
  const title = decodeURIComponent(slug[slug.length - 1] ?? '')
    .replaceAll('-', ' ')
    .replace(/^./, (c) => c.toUpperCase())

  return (
    <>
      <PageHero title={title || 'Coming soon'} intro="This page is being built." />
      <div className="mx-auto w-full max-w-[1200px] px-4 py-section-tight md:px-6">
        <Button asChild variant="secondary">
          <Link href="/">Back to the home page</Link>
        </Button>
      </div>
    </>
  )
}
