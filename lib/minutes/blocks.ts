/**
 * Committee minutes are written in the site, not uploaded, so the body needs a
 * shape. It is an ordered list of typed blocks: a heading, a paragraph, or a
 * bullet list. Three types is enough to make minutes read properly and few
 * enough that the editor stays a form rather than a word processor.
 *
 * Nothing here is HTML, and nothing here is ever rendered as HTML. A committee
 * member pasting markup into a box gets that markup back as text, which is the
 * whole reason for storing blocks rather than a rich-text string.
 *
 * Safe on the server and in the browser.
 */

export const MINUTE_BLOCK_TYPES = ['heading', 'paragraph', 'bullets'] as const

export type MinuteBlockType = (typeof MINUTE_BLOCK_TYPES)[number]

export type MinuteBlock = {
  type: MinuteBlockType
  text: string
}

export const blockTypeLabels: Record<MinuteBlockType, string> = {
  heading: 'Heading',
  paragraph: 'Paragraph',
  bullets: 'Bullet list',
}

export const blockTypeHints: Record<MinuteBlockType, string> = {
  heading: 'A section title, shown larger and bolder',
  paragraph: 'Ordinary text, one or more sentences',
  bullets: 'One point per line, shown as bullets',
}

/**
 * The template a new set of minutes starts from: the running order a committee
 * meeting actually follows. Every heading can be renamed or removed, and the
 * paragraph under each one is where the minute goes.
 */
export function minutesTemplate(): MinuteBlock[] {
  const sections = [
    'Present',
    'Apologies',
    'Minutes of the last meeting',
    'Matters arising',
    "Treasurer's report",
    'Membership',
    'Site and equipment',
    'Events and coaching',
    'Any other business',
    'Date of the next meeting',
  ]
  return sections.flatMap<MinuteBlock>((heading) => [
    { type: 'heading', text: heading },
    { type: 'paragraph', text: '' },
  ])
}

/** Read whatever is in the jsonb column without trusting its shape. */
export function parseBlocks(value: unknown): MinuteBlock[] {
  if (!Array.isArray(value)) return []
  const blocks: MinuteBlock[] = []
  for (const raw of value) {
    if (!raw || typeof raw !== 'object') continue
    const candidate = raw as { type?: unknown; text?: unknown }
    const type = MINUTE_BLOCK_TYPES.find((t) => t === candidate.type)
    if (!type) continue
    blocks.push({ type, text: typeof candidate.text === 'string' ? candidate.text : '' })
  }
  return blocks
}

/** Drop blocks the committee left empty, so a half-filled template reads cleanly. */
export function pruneBlocks(blocks: MinuteBlock[]): MinuteBlock[] {
  return blocks.filter((b) => b.text.trim().length > 0)
}

/** The lines of a bullet block, one point per line. */
export function bulletLines(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.replace(/^\s*[-*•]\s*/, '').trim())
    .filter(Boolean)
}

/** Flat text, for list previews and for anything that needs to search minutes. */
export function blocksToPlainText(blocks: MinuteBlock[]): string {
  return blocks
    .map((b) => (b.type === 'bullets' ? bulletLines(b.text).join(' ') : b.text))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** A one-line taste of the minutes for a card, without cutting a word in half. */
export function minutesPreview(blocks: MinuteBlock[], max = 160): string {
  const firstParagraph = blocks.find((b) => b.type !== 'heading' && b.text.trim())
  const text = firstParagraph
    ? (firstParagraph.type === 'bullets'
        ? bulletLines(firstParagraph.text).join(', ')
        : firstParagraph.text
      ).trim()
    : blocksToPlainText(blocks)
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return `${cut.slice(0, lastSpace > 40 ? lastSpace : max).trimEnd()}…`
}

/** How many sections a set of minutes has, for the list view. */
export function countSections(blocks: MinuteBlock[]): number {
  return blocks.filter((b) => b.type === 'heading' && b.text.trim()).length
}
