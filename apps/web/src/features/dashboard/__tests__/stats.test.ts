import { describe, it, expect } from 'vitest'
import { computeStats } from '../stats'
import type { Task } from '../../tasks/types'
import type { FocusSession } from '@/server/repositories/focus-session-repository'
import type { Habit, HabitLog } from '@/server/repositories/habit-repository'

const now = new Date('2026-10-03T09:00:00')

function task(overrides: Partial<Task> = {}): Task {
  return {
    id: 't1',
    title: 'A',
    content: null,
    eisenhowerQuadrant: null,
    dueAt: null,
    startAt: null,
    remindAt: null,
    isDone: false,
    doneAt: null,
    parentId: null,
    listId: null,
    myDayAt: null,
    deletedAt: null,
    ...overrides,
  }
}

function habit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'h1',
    name: 'Uống nước',
    color: null,
    icon: null,
    frequency: 'daily',
    targetCount: 1,
    startDate: new Date('2026-10-01'),
    archived: false,
    ...overrides,
  }
}

describe('computeStats', () => {
  it('counts nothing on an empty dataset', () => {
    const s = computeStats({ tasks: [], focusSessions: [], habits: [], habitLogs: {} }, now)
    expect(s.completedToday).toBe(0)
    expect(s.overdue).toBe(0)
    expect(s.focusMinutesToday).toBe(0)
    expect(s.quadrants).toEqual({ A: 0, B: 0, C: 0, D: 0 })
  })

  it('counts tasks completed today', () => {
    const s = computeStats(
      {
        tasks: [
          task({ id: 'a', isDone: true, doneAt: new Date('2026-10-03T08:00:00') }),
          task({ id: 'b', isDone: true, doneAt: new Date('2026-10-02T08:00:00') }),
        ],
        focusSessions: [],
        habits: [],
        habitLogs: {},
      },
      now,
    )
    expect(s.completedToday).toBe(1)
  })

  it('counts tasks completed this week', () => {
    const s = computeStats(
      {
        tasks: [
          task({ id: 'a', isDone: true, doneAt: new Date('2026-10-01T08:00:00') }),
          task({ id: 'b', isDone: true, doneAt: new Date('2026-09-20T08:00:00') }),
        ],
        focusSessions: [],
        habits: [],
        habitLogs: {},
      },
      now,
    )
    expect(s.completedThisWeek).toBe(1)
  })

  it('counts overdue open tasks', () => {
    const s = computeStats(
      {
        tasks: [
          task({ id: 'a', isDone: false, dueAt: new Date('2026-10-01T08:00:00') }),
          task({ id: 'b', isDone: false, dueAt: new Date('2026-10-05T08:00:00') }),
        ],
        focusSessions: [],
        habits: [],
        habitLogs: {},
      },
      now,
    )
    expect(s.overdue).toBe(1)
  })

  it('does not count a completed overdue task', () => {
    const s = computeStats(
      {
        tasks: [task({ id: 'a', isDone: true, dueAt: new Date('2026-10-01T08:00:00'), doneAt: new Date('2026-10-02') })],
        focusSessions: [],
        habits: [],
        habitLogs: {},
      },
      now,
    )
    expect(s.overdue).toBe(0)
  })

  it('sums completed focus minutes today', () => {
    const sessions: FocusSession[] = [
      { id: '1', mode: 'work', startedAt: new Date('2026-10-03T08:00:00'), endedAt: new Date('2026-10-03T08:25:00'), durationMin: 25, completed: true, taskId: null },
      { id: '2', mode: 'break', startedAt: new Date('2026-10-03T08:25:00'), endedAt: new Date('2026-10-03T08:30:00'), durationMin: 5, completed: true, taskId: null },
    ]
    const s = computeStats({ tasks: [], focusSessions: sessions, habits: [], habitLogs: {} }, now)
    expect(s.focusMinutesToday).toBe(25)
  })

  it('counts Eisenhower quadrants', () => {
    const s = computeStats(
      {
        tasks: [
          task({ id: 'a', eisenhowerQuadrant: 'A' }),
          task({ id: 'b', eisenhowerQuadrant: 'A' }),
          task({ id: 'c', eisenhowerQuadrant: 'C' }),
        ],
        focusSessions: [],
        habits: [],
        habitLogs: {},
      },
      now,
    )
    expect(s.quadrants).toEqual({ A: 2, B: 0, C: 1, D: 0 })
  })

  it('excludes quadrant null from every bucket', () => {
    const s = computeStats(
      { tasks: [task({ id: 'a', eisenhowerQuadrant: null })], focusSessions: [], habits: [], habitLogs: {} },
      now,
    )
    expect(Object.values(s.quadrants).reduce((a, b) => a + b, 0)).toBe(0)
  })

  it('computes habit completion rate for today', () => {
    const logs: HabitLog[] = [
      { id: '1', habitId: 'h1', date: new Date('2026-10-03T08:00:00'), count: 1 },
    ]
    const s = computeStats(
      { tasks: [], focusSessions: [], habits: [habit(), habit({ id: 'h2' })], habitLogs: { h1: logs, h2: [] } },
      now,
    )
    expect(s.habitCompletionRate).toBe(50)
  })

  it('reports zero habit rate with no habits', () => {
    const s = computeStats({ tasks: [], focusSessions: [], habits: [], habitLogs: {} }, now)
    expect(s.habitCompletionRate).toBe(0)
  })

  it('excludes archived habits from the rate', () => {
    const logs: HabitLog[] = [
      { id: '1', habitId: 'h1', date: new Date('2026-10-03T08:00:00'), count: 1 },
    ]
    const s = computeStats(
      {
        tasks: [],
        focusSessions: [],
        habits: [habit(), habit({ id: 'h2', archived: true })],
        habitLogs: { h1: logs, h2: [] },
      },
      now,
    )
    expect(s.habitCompletionRate).toBe(100)
  })
})
