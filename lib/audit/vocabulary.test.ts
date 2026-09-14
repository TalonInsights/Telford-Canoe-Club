import { describe, expect, it } from 'vitest'

import {
  auditCategory,
  auditCategoryLabel,
  auditLabel,
  auditSubjectName,
  describeAudit,
} from './vocabulary'

/**
 * The payloads below are copied from what the live database actually wrote
 * during the 0031 tests, not invented, so this fails if the trigger's shape
 * and the reader's expectations ever drift apart.
 */

describe('describeAudit', () => {
  it('names contact fields without repeating the value, which is not stored', () => {
    const text = describeAudit(
      { fields: ['phone', 'town'] },
      { fields: ['phone', 'town'], name: 'Rebecca Farley-Brown' }
    )
    expect(text).toBe('phone and town changed')
  })

  it('collapses the two address lines into one mention', () => {
    expect(describeAudit({ fields: ['address_line1', 'address_line2'] }, { fields: ['address_line1', 'address_line2'] })).toBe(
      'address changed'
    )
  })

  it('shows both values where the old one was kept', () => {
    const text = describeAudit(
      { fields: ['last_name'], last_name: 'Farley-Brown' },
      { fields: ['last_name'], last_name: 'Farley-Brownstone', name: 'Rebecca Farley-Brownstone' }
    )
    expect(text).toBe('last name: Farley-Brown → Farley-Brownstone')
  })

  it('reads a boolean as on and off rather than true and false', () => {
    const text = describeAudit(
      { fields: ['email_opt_in'], email_opt_in: true },
      { fields: ['email_opt_in'], email_opt_in: false }
    )
    expect(text).toBe('club news preference: on → off')
  })

  it('handles a mixed change, values first then the rest', () => {
    const text = describeAudit(
      { fields: ['first_name', 'phone'], first_name: 'Bec' },
      { fields: ['first_name', 'phone'], first_name: 'Rebecca', name: 'Rebecca Farley-Brown' }
    )
    expect(text).toBe('first name: Bec → Rebecca · phone changed')
  })

  it('reads the role entry, which has no fields list', () => {
    const text = describeAudit(
      { role: 'member' },
      { role: 'admin', name: 'Simon Wiles' }
    )
    expect(text).toBe('site role: member → admin')
  })

  it('keeps a reason that was recorded alongside the change', () => {
    // The shape of the real role-change entry written on 8 September.
    const text = describeAudit(
      { role: 'member' },
      { role: 'admin', reason: 'client request 9 Sep 2026: chairman to have full admin' }
    )
    expect(text).toBe(
      'site role: member → admin · reason: client request 9 Sep 2026: chairman to have full admin'
    )
  })

  it('says blank rather than null when a value is cleared', () => {
    expect(describeAudit({ fields: ['bc_membership_number'], bc_membership_number: '12345' }, { fields: ['bc_membership_number'], bc_membership_number: null })).toBe(
      'Paddle UK number: 12345 → blank'
    )
  })

  it('falls back to readable text for an entry it has never seen', () => {
    expect(describeAudit(null, { amount_pence: 2500, source: 'manual_cash' })).toBe(
      'amount pence: 2500 · source: manual_cash'
    )
  })

  it('does not fall over on an empty payload', () => {
    expect(describeAudit(null, null)).toBe('No detail recorded')
  })
})

describe('auditLabel', () => {
  it('uses the written label where there is one', () => {
    expect(auditLabel('profile.updated_by_committee')).toBe('Record edited by the committee')
    expect(auditLabel('profile.updated_by_system')).toBe('Record changed by the system')
  })

  it('prettifies an action nobody has labelled, rather than showing the key', () => {
    expect(auditLabel('membership.extended')).toBe('Extended')
    expect(auditLabel('river_band.created')).toBe('Created')
    expect(auditLabel('something.nobody_has_written_yet')).toBe('Nobody has written yet')
  })
})

describe('auditCategory', () => {
  it('files by prefix', () => {
    expect(auditCategory('profile.updated')).toBe('members')
    expect(auditCategory('merch.order_created')).toBe('shop')
    expect(auditCategory('minutes.published')).toBe('content')
  })

  it('refuses to guess, so no row is badged with a filter that would hide it', () => {
    expect(auditCategory('newthing.done')).toBeNull()
    expect(auditCategoryLabel('newthing.done')).toBe('Newthing')
    expect(auditCategoryLabel('profile.updated')).toBe('Members and committee')
  })
})

describe('auditSubjectName', () => {
  it('prefers the name on the after side, and tolerates neither', () => {
    expect(auditSubjectName({ name: 'Rebecca Farley-Brown' }, null)).toBe('Rebecca Farley-Brown')
    expect(auditSubjectName(null, { name: 'David Allen' })).toBe('David Allen')
    expect(auditSubjectName({ fields: ['phone'] }, null)).toBeNull()
  })
})
