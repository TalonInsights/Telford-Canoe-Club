import { describe, expect, it } from 'vitest'

import {
  formatDate,
  formatDateShort,
  formatDateTimeRange,
  formatMoneyGBP,
  formatTime,
} from './format'

describe('formatMoneyGBP', () => {
  it('renders whole pounds without pence', () => {
    expect(formatMoneyGBP(2500)).toBe('£25')
    expect(formatMoneyGBP(4000)).toBe('£40')
  })
  it('keeps pence when present', () => {
    expect(formatMoneyGBP(1250)).toBe('£12.50')
    expect(formatMoneyGBP(99)).toBe('£0.99')
  })
})

describe('dates in Europe/London', () => {
  // 2026-07-01T18:30Z is 19:30 BST — the helper must show London wall time.
  const bst = '2026-07-01T18:30:00Z'
  const gmt = '2026-01-15T09:00:00Z'

  it('formats long dates', () => {
    expect(formatDate(gmt)).toBe('15 January 2026')
  })
  it('formats short dates', () => {
    expect(formatDateShort(bst)).toBe('Wed 1 Jul')
  })
  it('shows BST wall-clock time in summer', () => {
    expect(formatTime(bst)).toBe('7:30pm')
  })
  it('ranges on one day collapse the date', () => {
    expect(formatDateTimeRange('2026-07-01T16:30:00Z', '2026-07-01T20:00:00Z')).toBe(
      'Wed 1 Jul, 5:30pm–9pm'
    )
  })
  it('ranges across days show both', () => {
    expect(formatDateTimeRange('2026-07-01T18:00:00Z', '2026-07-02T08:00:00Z')).toBe(
      'Wed 1 Jul 7pm – Thu 2 Jul 9am'
    )
  })
})
