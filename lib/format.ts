/**
 * P0-24 — display helpers. All dates render in Europe/London regardless of
 * server timezone; all money is GBP from integer pence (no floats).
 */

const LONDON = 'Europe/London'

export function formatMoneyGBP(pence: number): string {
  const pounds = pence / 100
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: pence % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(pounds)
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: LONDON,
  }).format(d)
}

export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: LONDON,
  }).format(d)
}

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-GB', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: LONDON,
  })
    .format(d)
    .replace(' ', '')
    .replace(':00', '')
}

/** "Thu 5 Jun, 5:30–9pm" (same day) or "Thu 5 Jun 7pm – Fri 6 Jun 9am". */
export function formatDateTimeRange(start: Date | string, end?: Date | string | null): string {
  const s = typeof start === 'string' ? new Date(start) : start
  const e = end ? (typeof end === 'string' ? new Date(end) : end) : null
  const dayKey = (d: Date) =>
    new Intl.DateTimeFormat('en-GB', { dateStyle: 'short', timeZone: LONDON }).format(d)
  if (!e) return `${formatDateShort(s)}, ${formatTime(s)}`
  if (dayKey(s) === dayKey(e)) return `${formatDateShort(s)}, ${formatTime(s)}–${formatTime(e)}`
  return `${formatDateShort(s)} ${formatTime(s)} – ${formatDateShort(e)} ${formatTime(e)}`
}
