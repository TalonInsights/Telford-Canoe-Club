import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { PageHero } from '@/components/layout/page-hero'
import { Section } from '@/components/layout/section'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/format'
import { getNewsPost, newsPosts } from '@/lib/content/news'

type Params = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return newsPosts.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const post = getNewsPost(slug)
  return { title: post?.title ?? 'News', description: post?.excerpt }
}

export default async function NewsPostPage({ params }: Params) {
  const { slug } = await params
  const post = getNewsPost(slug)
  if (!post) notFound()

  return (
    <>
      <PageHero title={post.title} intro={post.excerpt} />
      <Section tone="white">
        <article className="mx-auto w-full max-w-[720px]">
          <div className="flex flex-wrap items-center gap-3 border-b border-stone pb-4">
            <Badge variant="outline">{post.category}</Badge>
            <p className="text-sm text-ink-muted">
              <time>{formatDate(post.publishedAt)}</time> · {post.author}
            </p>
          </div>
          {post.image && (
            <div className="relative mt-6 aspect-[3/2] overflow-hidden rounded-xl">
              <Image
                src={post.image}
                alt={post.imageAlt}
                fill
                sizes="(min-width: 768px) 720px, 100vw"
                className="object-cover"
              />
            </div>
          )}
          {post.body.map((section, i) => (
            <section key={i} className="mt-6">
              {section.heading && <h2 className="text-xl">{section.heading}</h2>}
              {section.paragraphs.map((p, j) => (
                <p key={j} className="mt-3 text-ink-muted first:mt-2">
                  {p}
                </p>
              ))}
            </section>
          ))}
          <div className="mt-10 border-t border-stone pt-6">
            <Button asChild variant="secondary">
              <Link href="/news">All news</Link>
            </Button>
          </div>
        </article>
      </Section>
    </>
  )
}
