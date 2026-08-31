import type { Metadata } from 'next'

import { FullGrid } from '@/components/layout/grids'
import { PageHero } from '@/components/layout/page-hero'
import { Section } from '@/components/layout/section'
import { NewsCard } from '@/components/site/cards'
import { formatDate } from '@/lib/format'
import { newsPosts } from '@/lib/content/news'

export const metadata: Metadata = {
  title: 'News',
  description: 'The latest from Telford Canoe Club — membership, committee and event reports.',
}

export default function NewsPage() {
  return (
    <>
      <PageHero title="News" intro="What the club has been up to, straight from the committee." />
      <Section tone="white">
        <FullGrid maxColumns={3}>
          {newsPosts.map((p) => (
            <NewsCard
              key={p.slug}
              href={`/news/${p.slug}`}
              image={p.image}
              imageAlt={p.imageAlt}
              title={p.title}
              summary={p.excerpt}
              category={p.category}
              date={formatDate(p.publishedAt)}
            />
          ))}
        </FullGrid>
      </Section>
    </>
  )
}
