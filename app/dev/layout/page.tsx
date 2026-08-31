import { Container } from '@/components/layout/container'
import { Footer } from '@/components/layout/footer'
import { CentredColumn, FullGrid, Split75 } from '@/components/layout/grids'
import { Header } from '@/components/layout/header'
import { PageHero } from '@/components/layout/page-hero'
import { Section } from '@/components/layout/section'
import { ImageFallback } from '@/components/site/image-fallback'
import { balancedColumns } from '@/lib/layout/balanced-columns'

const copyLengths = [
  'Short.',
  'A medium length summary that wraps onto a second line at most widths.',
  'A deliberately long block of card copy that goes on and on to prove that equal-height rows hold even when one card has three times the text of its neighbours, which is exactly what committee-authored content will do.',
]

function DummyCard({ i }: { i: number }) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-stone bg-card">
      <div className="relative aspect-[3/2]">
        <ImageFallback />
      </div>
      <div className="flex grow flex-col gap-2 p-4">
        <h3>Item {i + 1}</h3>
        <p className="text-sm text-ink-muted">{copyLengths[i % copyLengths.length]}</p>
        <p className="mt-auto pt-2 text-micro text-ink-muted">Meta row · stays at the foot</p>
      </div>
    </article>
  )
}

export default function LayoutDemo() {
  return (
    <>
      <Header />
      <main>
        <PageHero
        title="Layout proving ground"
        intro="Every §3.4 section shape with mismatched content, 1–8 items, at 375, 768 and 1280. Removed before launch (P12-02)."
      />

      {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => {
        const b = balancedColumns(n, n <= 4 ? 3 : 4)
        return (
          <Section
            key={n}
            tone={n % 2 === 0 ? 'white' : 'foam'}
            spacing="tight"
            title={`Full-grid, ${n} item${n > 1 ? 's' : ''} (max ${n <= 4 ? 3 : 4} cols)`}
            intro={`balancedColumns → ${b.columns} columns${b.remainder ? `, last ${b.remainder} span wider` : ', divides evenly'}`}
          >
            <FullGrid maxColumns={n <= 4 ? 3 : 4}>
              {Array.from({ length: n }, (_, i) => (
                <DummyCard key={i} i={i} />
              ))}
            </FullGrid>
          </Section>
        )
      })}

      <Section
        tone="deep"
        spacing="tight"
        title="Split 7/5 — media right"
        intro="Text 58%, 68ch inner measure, media fills the cell."
      >
        <Split75 side="right" media={<ImageFallback className="bg-river" />}>
          <h3>Whitewater on your doorstep</h3>
          <p className="mt-2 text-stone">
            Jackfield Rapids gives the club grade-two water minutes from the Ironbridge gorge
            museums, with parking and containers built by the army reserves in the eighties.
          </p>
        </Split75>
      </Section>

      <Section tone="foam" spacing="tight" title="Split 7/5 — media left (alternated)">
        <Split75 side="left" media={<ImageFallback />}>
          <h3>Freestyle and flat water too</h3>
          <p className="mt-2 text-ink-muted">
            The same stretch serves freestyle sessions when levels are right, and the canal takes
            paddleboarders on calmer evenings.
          </p>
        </Split75>
      </Section>

      <Section tone="white" spacing="tight" title="Centred column — prose">
        <CentredColumn>
          <p>
            Long-form content sits in a 720px column so committee-written pages never stretch
            across the full 1200px frame. The measure stays inside 68 characters, which keeps
            line-returns comfortable on a phone held in one hand at the water&apos;s edge.
          </p>
        </CentredColumn>
      </Section>

      <Section tone="deep" spacing="tight" title="Empty state — section keeps its height">
        <div className="flex min-h-[280px] items-center justify-center rounded-xl border border-river">
          <div className="p-6 text-center">
            <p className="font-medium">Nothing scheduled</p>
            <p className="mt-1 text-sm text-stone">Check back soon, or join to hear first.</p>
          </div>
        </div>
      </Section>

        <div className="bg-foam py-8">
          <Container>
            <p className="text-micro text-ink-muted">
              Audit: section edges align to this container; tones alternate; last rows balanced;
              sibling image boxes share one ratio; no text block over 68ch.
            </p>
          </Container>
        </div>
      </main>
      <Footer />
    </>
  )
}
