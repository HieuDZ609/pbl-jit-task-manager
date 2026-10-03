import { describe, it, expect } from 'vitest'
import { toDateKey, currentStreak, longestStreak, buildHeatmap, completionRate } from '../streak'

const today = new Date('2026-10-03T09:00:00')

describe('toDateKey', () => {
  it('formats as local YYYY-MM-DD', () => {
    expect(toDateKey(new Date('2026-10-03T09:00:00'))).toBe('2026-10-03')
  })

  it('pads single digit month and day', () => {
    expect(toDateKey(new Date('2026-01-05T09:00:00'))).toBe('2026-01-05')
  })
})

describe('currentStreak', () => {
  it('is 0 with no logs', () => {
    expect(currentStreak([], today)).toBe(0)
  })

  it('is 1 when only today is logged', () => {
    expect(currentStreak(['2026-10-03'], today)).toBe(1)
  })

  it('counts consecutive days ending today', () => {
    expect(currentStreak(['2026-10-01', '2026-10-02', '2026-10-03'], today)).toBe(3)
  })

  it('still counts when yesterday is the last entry', () => {
    expect(currentStreak(['2026-10-01', '2026-10-02'], today)).toBe(2)
  })

  it('resets when the last entry is 2 days ago', () => {
    expect(currentStreak(['2026-10-01'], today)).toBe(0)
  })

  it('stops at a gap', () => {
    expect(currentStreak(['2026-09-30', '2026-10-01', '2026-10-03'], today)).toBe(1)
  })
})

describe('longestStreak', () => {
  it('is 0 with no logs', () => {
    expect(longestStreak([])).toBe(0)
  })

  it('finds the longest run anywhere in history', () => {
    expect(longestStreak(['2026-01-01', '2026-01-02', '2026-01-03', '2026-02-01'])).toBe(3)
  })

  it('handles a single day', () => {
    expect(longestStreak(['2026-05-05'])).toBe(1)
  })

  it('ignores duplicate dates', () => {
    expect(longestStreak(['2026-05-05', '2026-05-05', '2026-05-06'])).toBe(2)
  })
})

describe('buildHeatmap', () => {
  it('returns one cell per requested day', () => {
    expect(buildHeatmap([], 7, today)).toHaveLength(7)
  })

  it('ends with today as the last cell', () => {
    const cells = buildHeatmap([], 7, today)
    expect(cells[cells.length - 1].dateKey).toBe('2026-10-03')
  })

  it('starts 6 days before today for a 7 day window', () => {
    const cells = buildHeatmap([], 7, today)
    expect(cells[0].dateKey).toBe('2026-09-27')
  })

  it('assigns level 0 to empty days', () => {
    const cells = buildHeatmap([], 7, today)
    expect(cells.every((c) => c.level === 0)).toBe(true)
  })

  it('assigns a higher level for logged days', () => {
    const cells = buildHeatmap(['2026-10-03'], 7, today)
    expect(cells[cells.length - 1].level).toBeGreaterThan(0)
  })

  it('caps the level at 4', () => {
    const cells = buildHeatmap(['2026-10-03'], 7, today)
    expect(cells[cells.length - 1].level).toBeLessThanOrEqual(4)
  })
})

describe('completionRate', () => {
  it('is 0 when target is 0', () => {
    expect(completionRate(3, 0)).toBe(0)
  })

  it('computes percentage of target', () => {
    expect(completionRate(3, 4)).toBe(75)
  })

  it('caps at 100', () => {
    expect(completionRate(9, 4)).toBe(100)
  })

  it('is 0 when nothing logged', () => {
    expect(completionRate(0, 5)).toBe(0)
  })
})
