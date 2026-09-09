import { BlocksView } from '@/components/site/blocks-view'
import type { MinuteBlock } from '@/lib/minutes/blocks'

/** Minutes as members read them; the block rendering itself is shared. */
export function MinutesView({ body }: { body: MinuteBlock[] }) {
  return (
    <BlocksView
      body={body}
      empty={<p className="text-ink-muted">These minutes have not been written up yet.</p>}
    />
  )
}
