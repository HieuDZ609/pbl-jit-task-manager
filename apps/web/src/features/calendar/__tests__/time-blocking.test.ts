import { describe, it, expect } from 'vitest'
import { blockTask, buildHourSlots, tasksForDay, unblockTask } from '../time-blocking'

const day = new Date('2026-10-03T00:00:00')

describe('buildHourSlots', () => {
  it('builds 24 hourly slots', () => {
    expect(buildHourSlots()).toHaveLength(24)
  })

  it('labels slots 00 to 23', () => {
    const slots = buildHourSlots()
    expect(slots[0].label).toBe('00:00')
    expect(slots[23].label).toBe('23:00')
  })
})

describe('blockTask', () => {
  const base = [{ id: '1', title: 'A', isDone: false, startAt: null, dueAt: null }]

  it('sets startAt and dueAt from a slot', () => {
    const [t] = blockTask(base as never, '1', 9, 60, day)
    expect(t.startAt?.getHours()).toBe(9)
    expect(t.dueAt?.getHours()).toBe(10)
  })

  it('spans multiple hours for long duration', () => {
    const [t] = blockTask(base as never, '1', 9, 180, day)
    expect(t.dueAt?.getHours()).toBe(12)
  })

  it('ignores unknown task id', () => {
    expect(blockTask(base as never, 'zz', 9, 60, day)).toBe(base)
  })

  it('wraps past midnight to next day', () => {
    const [t] = blockTask(base as never, '1', 23, 120, day)
    expect(t.dueAt?.getDate()).toBe(4)
  })
})

describe('unblockTask', () => {
  it('clears startAt and dueAt', () => {
    const withBlock = [{ id: '1', title: 'A', isDone: false, startAt: new Date(), dueAt: new Date() }]
    const [t] = unblockTask(withBlock as never, '1')
    expect(t.startAt).toBeNull()
    expect(t.dueAt).toBeNull()
  })
})

describe('tasksForDay', () => {
  it('returns tasks whose block falls on the day', () => {
    const tasks = [
      { id: '1', title: 'A', isDone: false, startAt: new Date('2026-10-03T09:00:00'), dueAt: null },
      { id: '2', title: 'B', isDone: false, startAt: new Date('2026-10-04T09:00:00'), dueAt: null },
      { id: '3', title: 'C', isDone: false, startAt: null, dueAt: new Date('2026-10-03T18:00:00') },
    ]
    expect(tasksForDay(tasks as never, day).map((t) => t.id).sort()).toEqual(['1', '3'])
  })

  it('ignores deleted tasks', () => {
    const tasks = [
      { id: '1', title: 'A', isDone: false, startAt: new Date('2026-10-03T09:00:00'), deletedAt: new Date() },
    ]
    expect(tasksForDay(tasks as never, day)).toEqual([])
  })

  it('spans a task that starts before and ends after the day', () => {
    const tasks = [
      { id: '1', title: 'A', isDone: false, startAt: new Date('2026-10-02T22:00:00'), dueAt: new Date('2026-10-03T03:00:00') },
    ]
    expect(tasksForDay(tasks as never, day)).toHaveLength(1)
  })
})
