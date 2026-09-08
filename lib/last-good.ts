/**
 * A tiny in-memory "last known good" holder for third-party readings.
 *
 * The Environment Agency's flood-monitoring API is a beta service and its
 * latency swings from under a second to over twenty. When a call times out we
 * would rather show the previous reading, stamped with its own timestamp, than
 * an empty cell: the strip already prints the time each reading was taken, so
 * a slightly older number is honest rather than misleading. Values older than
 * the cap are discarded, so a long outage still falls back to "unavailable"
 * instead of quietly showing yesterday's river.
 *
 * Per server instance and deliberately not shared: it is a cushion over a
 * flaky upstream, never the source of truth.
 */
export type LastGoodStore<T> = {
  remember: (value: T) => T
  recall: () => T | null
}

export function lastGoodStore<T>(maxAgeMs: number): LastGoodStore<T> {
  let entry: { at: number; value: T } | null = null
  return {
    remember(value: T): T {
      entry = { at: Date.now(), value }
      return value
    },
    recall(): T | null {
      if (!entry) return null
      return Date.now() - entry.at <= maxAgeMs ? entry.value : null
    },
  }
}
