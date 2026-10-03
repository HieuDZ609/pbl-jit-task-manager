import { describe, it, expect } from 'vitest'
import { isOverdue, sortByDue, nextOccurrence, snoozeUntil, isDueSoon, describeReminder } from '../reminder-logic'
import type { Reminder } from '../../../server/repositories/reminder-repository'

const now = new Date('2026-10-03T09:00:00')

function reminder(overrides: Partial<Reminder> = {}): Reminder {
  return {
    id: 'r1',
    title: 'Gọi mẹ',
    dueAt: new Date('2026-10-03T10:00:00'),
    repeat: 'none',
    done: false,
    notifiedAt: null,
    ...overrides,
  }
}

describe('isOverdue', () => {
  it('is false for a completed reminder', () => {
    expect(isOverdue(reminder({ done: true }), now)).toBe(false)
  })

  it('is false when the due time is in the future', () => {
    expect(isOverdue(reminder(), now)).toBe(false)
  })

  it('is true when the due time has passed', () => {
    expect(isOverdue(reminder({ dueAt: new Date('2026-10-03T08:00:00') }), now)).toBe(true)
  })
})

describe('sortByDue', () => {
  it('puts the earliest reminder first', () => {
    const a = reminder({ id: 'a', dueAt: new Date('2026-10-03T12:00:00') })
    const b = reminder({ id: 'b', dueAt: new Date('2026-10-03T08:00:00') })
    expect(sortByDue([a, b]).map((r) => r.id)).toEqual(['b', 'a'])
  })

  it('sorts completed reminders last', () => {
    const a = reminder({ id: 'a', dueAt: new Date('2026-10-03T08:00:00') })
    const b = reminder({ id: 'b', dueAt: new Date('2026-10-03T12:00:00'), done: true })
    expect(sortByDue([b, a]).map((r) => r.id)).toEqual(['a', 'b'])
  })

  it('does not mutate the input', () => {
    const input = [reminder({ id: 'a' }), reminder({ id: 'b', dueAt: new Date('2026-10-03T08:00:00') })]
    const copy = [...input]
    sortByDue(input)
    expect(input).toEqual(copy)
  })
})

describe('snoozeUntil', () => {
  it('adds 10 minutes by default', () => {
    expect(snoozeUntil(now).toISOString()).toBe(new Date('2026-10-03T09:10:00').toISOString())
  })

  it('accepts a custom offset', () => {
    expect(snoozeUntil(now, 60).toISOString()).toBe(new Date('2026-10-03T10:00:00').toISOString())
  })
})

describe('isDueSoon', () => {
  it('is true inside the window', () => {
    expect(isDueSoon(new Date('2026-10-03T09:30:00'), now, 60)).toBe(true)
  })

  it('is false outside the window', () => {
    expect(isDueSoon(new Date('2026-10-03T12:00:00'), now, 60)).toBe(false)
  })

  it('is false for a past time', () => {
    expect(isDueSoon(new Date('2026-10-03T08:00:00'), now, 60)).toBe(false)
  })
})

describe('nextOccurrence', () => {
  it('returns null for a one-off reminder', () => {
    expect(nextOccurrence(reminder(), now)).toBeNull()
  })

  it('advances a daily reminder by one day', () => {
    const next = nextOccurrence(reminder({ repeat: 'daily' }), now)
    expect(next?.toISOString()).toBe(new Date('2026-10-04T10:00:00').toISOString())
  })

  it('advances a weekly reminder by seven days', () => {
    const next = nextOccurrence(reminder({ repeat: 'weekly' }), now)
    expect(next?.toISOString()).toBe(new Date('2026-10-10T10:00:00').toISOString())
  })
})

describe('describeReminder', () => {
  it('marks an overdue reminder as quá hạn', () => {
    expect(describeReminder(reminder({ dueAt: new Date('2026-10-03T08:00:00') }), now)).toMatch(/quá hạn/i)
  })

  it('marks a due soon reminder as sắp đến hạn', () => {
    expect(describeReminder(reminder(), now)).toMatch(/sắp đến hạn/i)
  })

  it('describes a far future reminder as còn lâu', () => {
    expect(describeReminder(reminder({ dueAt: new Date('2026-10-05T10:00:00') }), now)).toMatch(/còn lâu/i)
  })
})
