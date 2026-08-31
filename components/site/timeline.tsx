/**
 * P0-23 — pattern from 21st.dev "Timeline"
 * (https://21st.dev/@Codehagen/components/timeline, MIT). Static by §3.6 —
 * no scroll animation. Used for club history and membership history.
 */

export type TimelineEntry = {
  marker: string
  title: string
  description?: React.ReactNode
}

export function Timeline({ entries }: { entries: TimelineEntry[] }) {
  return (
    <ol className="relative space-y-8 border-l border-stone pl-6">
      {entries.map((entry) => (
        <li key={`${entry.marker}-${entry.title}`} className="relative">
          <span
            aria-hidden="true"
            className="absolute top-1.5 -left-[1.85rem] size-2.5 rounded-full border-2 border-river bg-card"
          />
          <p className="text-micro font-medium tracking-wide text-ink-muted">{entry.marker}</p>
          <h3 className="mt-0.5 text-lg">{entry.title}</h3>
          {entry.description && (
            <div className="mt-1 max-w-[68ch] text-sm text-ink-muted">{entry.description}</div>
          )}
        </li>
      ))}
    </ol>
  )
}
