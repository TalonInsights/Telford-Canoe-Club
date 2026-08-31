/**
 * §3.4 orphan rule. For n items at a maximum of c columns:
 * - if n divides evenly into c columns, use c;
 * - otherwise try c-1 down to 2 looking for a zero remainder;
 * - if nothing divides, use c and span the last row's items evenly
 *   (implemented on an LCM track count so fractional spans stay integers —
 *   e.g. 2 items left over in a 3-col grid → 6 tracks, they span 3 each).
 *
 * Returns everything a grid needs: the track count, the default span, and
 * the span for the last `remainder` items. remainder === 0 means no
 * special-casing is needed.
 */
export type BalancedGrid = {
  columns: number
  tracks: number
  itemSpan: number
  remainder: number
  lastRowSpan: number
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b)
}

export function balancedColumns(count: number, maxColumns: number): BalancedGrid {
  const max = Math.max(1, Math.floor(maxColumns))
  const n = Math.max(0, Math.floor(count))

  if (n === 0 || max === 1) {
    return { columns: 1, tracks: 1, itemSpan: 1, remainder: 0, lastRowSpan: 1 }
  }

  const cap = Math.min(max, n)
  for (let c = cap; c >= 2; c--) {
    if (n % c === 0) {
      return { columns: c, tracks: c, itemSpan: 1, remainder: 0, lastRowSpan: 1 }
    }
  }

  // Nothing divides: keep cap columns, balance the short last row by spans.
  const remainder = n % cap
  const tracks = (cap * remainder) / gcd(cap, remainder)
  return {
    columns: cap,
    tracks,
    itemSpan: tracks / cap,
    remainder,
    lastRowSpan: tracks / remainder,
  }
}

/** Spec-named convenience wrapper (§3.4); safe in server and client components. */
export function useBalancedColumns(count: number, maxColumns: number): BalancedGrid {
  return balancedColumns(count, maxColumns)
}
