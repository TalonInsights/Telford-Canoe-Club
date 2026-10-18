import { describe, expect, it } from 'vitest'

import { committeePhotoPath, isCommitteePhotoPath } from './site-images'

/**
 * The matcher rejected every real upload once, because its pattern was written
 * in a template literal with single backslashes (`\d` → "d"). These tests pin
 * the two things that catches: a genuine builder output must pass, and a path
 * for another role must fail.
 */
describe('isCommitteePhotoPath', () => {
  const role = '2c1d6507-2904-4d12-9987-5d8d670f046c'

  it('accepts what committeePhotoPath actually builds', () => {
    for (const name of ['photo.jpg', 'HOLIDAY.JPEG', 'snap.png', 'x.webp']) {
      const path = committeePhotoPath(role, name)
      expect(isCommitteePhotoPath(role, path)).toBe(true)
    }
  })

  it('accepts a known-good concrete path (the digits a timestamp leaves)', () => {
    expect(isCommitteePhotoPath(role, `committee/${role}/photo-1699999999999.jpg`)).toBe(true)
  })

  it('refuses a path for a different role', () => {
    const other = '00000000-0000-4000-8000-000000000001'
    expect(isCommitteePhotoPath(role, `committee/${other}/photo-1699999999999.jpg`)).toBe(false)
  })

  it('refuses paths that escape the role folder or the naming shape', () => {
    expect(isCommitteePhotoPath(role, `committee/${role}/../secret.jpg`)).toBe(false)
    expect(isCommitteePhotoPath(role, `events/${role}/cover-1.jpg`)).toBe(false)
    expect(isCommitteePhotoPath(role, `committee/${role}/photo-.jpg`)).toBe(false)
    expect(isCommitteePhotoPath(role, `committee/${role}/photo-123`)).toBe(false)
  })
})
