import { bulletLines, pruneBlocks, type MinuteBlock } from '@/lib/minutes/blocks'

/**
 * Typed blocks rendered as real elements. Used for minutes and for the
 * editable content slots, so a heading written by the committee is a heading
 * for a screen reader as well as for the eye.
 *
 * Nothing here goes near `dangerouslySetInnerHTML`: the body is data, so text
 * somebody typed can only ever be text.
 */
export function BlocksView({
  body,
  empty,
  tone = 'muted',
}: {
  body: MinuteBlock[]
  empty?: React.ReactNode
  tone?: 'muted' | 'ink'
}) {
  const blocks = pruneBlocks(body)
  if (blocks.length === 0) return <>{empty ?? null}</>

  const proseClass = tone === 'ink' ? 'text-ink' : 'text-ink-muted'

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
            <ul key={i} className={`ml-5 grid list-disc gap-1.5 marker:text-river ${proseClass}`}>
              {bulletLines(block.text).map((line, n) => (
                <li key={n}>{line}</li>
              ))}
            </ul>
          )
        }
        return (
          <p key={i} className={`max-w-[68ch] whitespace-pre-line ${proseClass}`}>
            {block.text}
          </p>
        )
      })}
    </div>
  )
}
