import { describe, it, expect } from 'vitest'
import { selectSmartList } from '../smart-lists'
import type { Task } from '../types'

const now = new Date('2026-10-03T10:00:00.000Z')

function task(overrides: Partial<Task> & { id: string }): Task {
  return {
    title: 't',
    isDone: false,
    deletedAt: null,
    dueAt: null,
    ...overrides,
  }
}

describe('selectSmartList', () => {
  it('returns empty for no tasks', () => {
    expect(selectSmartList([], 'today', now)).toEqual([])
  })

  it('today includes tasks due today and excludes done', () => {
    const tasks = [
      task({ id: '1', dueAt: new Date('2026-10-03T01:00:00.000Z') }),
      task({ id: '2', dueAt: new Date('2026-10-03T09:00:00.000Z'), isDone: true }),
      task({ id: '3', dueAt: new Date('2026-10-04T01:00:00.000Z') }),
    ]
    expect(selectSmartList(tasks, 'today', now).map((t) => t.id)).toEqual(['1'])
  })

  it('tomorrow includes tasks due tomorrow', () => {
    const tasks = [task({ id: '1', dueAt: new Date('2026-10-04T01:00:00.000Z') })]
    expect(selectSmartList(tasks, 'tomorrow', now).map((t) => t.id)).toEqual(['1'])
  })

  it('overdue includes past due unfinished tasks', () => {
    const tasks = [
      task({ id: '1', dueAt: new Date('2026-10-01T01:00:00.000Z') }),
      task({ id: '2', dueAt: new Date('2026-10-01T01:00:00.000Z'), isDone: true }),
    ]
    expect(selectSmartList(tasks, 'overdue', now).map((t) => t.id)).toEqual(['1'])
  })

  it('upcoming includes future due beyond tomorrow', () => {
    const tasks = [task({ id: '1', dueAt: new Date('2026-10-10T01:00:00.000Z') })]
    expect(selectSmartList(tasks, 'upcoming', now).map((t) => t.id)).toEqual(['1'])
  })

  it('all excludes deleted tasks', () => {
    const tasks = [
      task({ id: '1' }),
      task({ id: '2', deletedAt: new Date('2026-10-02T00:00:00.000Z') }),
    ]
    expect(selectSmartList(tasks, 'all', now).map((t) => t.id)).toEqual(['1'])
  })

  it('completed returns only done tasks', () => {
    const tasks = [task({ id: '1', isDone: true }), task({ id: '2' })]
    expect(selectSmartList(tasks, 'completed', now).map((t) => t.id)).toEqual(['1'])
  })
})
