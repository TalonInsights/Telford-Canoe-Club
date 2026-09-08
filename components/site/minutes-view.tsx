import { bulletLines, pruneBlocks, type MinuteBlock } from '@/lib/minutes/blocks'

/**
 * Minutes as members read them. Blocks become elements, so a heading is a real
 * heading for anyone using a screen reader and for anyone skimming with their
 * eyes. Nothing is passed through `dangerouslySetInnerHTML`: the body is data,
 * so text a committee member typed can only ever be text.
 */
export function MinutesView({ body }: { body: MinuteBlock[] }) {
  const blocks = pruneBlocks(body)

  if (blocks.length === 0) {
    return <p className="text-ink-muted">These minutes have not been written up yet.</p>
  }

  return (
    <div className="grid gap-4">
      {blocks.map((block, i) => {
        if (block.type === 'heading') {
          return (
            <h2 key={i} className="mt-2 text-xl first:mt-0">
              {block.text}
            </h2>
          )
        }
        if (block.type === 'bullets') {
          return (
            <ul key={i} className="ml-5 grid list-disc gap-1.5 text-ink-muted marker:text-river">
              {bulletLines(block.text).map((line, n) => (
                <li key={n}>{line}</li>
              ))}
            </ul>
          )
        }
        return (
          <p key={i} className="max-w-[68ch] whitespace-pre-line text-ink-muted">
            {block.text}
          </p>
        )
      })}
    </div>
  )
}
