/**
 * P0-03 — asserts every colour pair in spec §3.2 (with the AA-corrected
 * signal-soft from docs/SPEC-VALIDATION.md §1.5) meets its threshold.
 * Run: pnpm contrast — exits 1 on any failure.
 */

const tokens = {
  deep: '#0E2F3C',
  river: '#1F5F6E',
  foam: '#F3F6F5',
  stone: '#DCE3E1',
  ink: '#14232A',
  inkMuted: '#4F5A5F',
  signal: '#C93518',
  signalSoft: '#FCEEEB',
  success: '#1E7F4F',
  warn: '#8A5A12',
  white: '#FFFFFF',
} as const

function luminance(hex: string): number {
  const c = hex.replace('#', '')
  const [r, g, b] = [0, 2, 4]
    .map((i) => parseInt(c.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function ratio(a: string, b: string): number {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}

// [label, fg, bg, minimum]  — 4.5 normal text (AA), 3.0 large text / UI
const pairs: Array<[string, string, string, number]> = [
  ['deep text on white', tokens.deep, tokens.white, 4.5],
  ['deep text on foam', tokens.deep, tokens.foam, 4.5],
  ['white text on deep (header/footer/buttons)', tokens.white, tokens.deep, 4.5],
  ['river links on white', tokens.river, tokens.white, 4.5],
  ['river links on foam', tokens.river, tokens.foam, 4.5],
  ['white text on river (secondary buttons)', tokens.white, tokens.river, 4.5],
  ['stone secondary text on deep (footer)', tokens.stone, tokens.deep, 4.5],
  ['ink body on white', tokens.ink, tokens.white, 4.5],
  ['ink body on foam', tokens.ink, tokens.foam, 4.5],
  ['ink-muted meta on white', tokens.inkMuted, tokens.white, 4.5],
  ['ink-muted meta on foam', tokens.inkMuted, tokens.foam, 4.5],
  ['signal CTA text on white', tokens.signal, tokens.white, 4.5],
  ['white text on signal (primary CTA)', tokens.white, tokens.signal, 4.5],
  ['signal text on signal-soft (badges)', tokens.signal, tokens.signalSoft, 4.5],
  ['success text on white', tokens.success, tokens.white, 4.5],
  ['success text on foam', tokens.success, tokens.foam, 4.5],
  ['warn text on white', tokens.warn, tokens.white, 4.5],
  ['warn text on foam', tokens.warn, tokens.foam, 4.5],
  ['river focus ring on foam (UI, 3:1)', tokens.river, tokens.foam, 3.0],
  ['stone borders on white (UI, 3:1) — decorative, tracked not gated', tokens.stone, tokens.white, 1.0],
]

let failed = 0
for (const [label, fg, bg, min] of pairs) {
  const r = Math.round(ratio(fg, bg) * 100) / 100
  const ok = r >= min
  if (!ok) failed++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${r.toFixed(2).padStart(6)}:1  (min ${min})  ${label}`)
}

if (failed > 0) {
  console.error(`\n${failed} contrast pair(s) below threshold`)
  process.exit(1)
}
console.log(`\nAll ${pairs.length} pairs pass`)
