import { describe, it, expect, beforeEach } from 'vitest'
import { InMemoryFocusSessionRepository } from '../in-memory-focus-session-repository'

describe('InMemoryFocusSessionRepository', () => {
  let repo: InMemoryFocusSessionRepository

  beforeEach(() => {
    repo = new InMemoryFocusSessionRepository()
  })

  it('records a session', async () => {
    const s = await repo.record({
      mode: 'work',
      startedAt: new Date('2026-10-03T09:00:00'),
      endedAt: new Date('2026-10-03T09:25:00'),
      durationMin: 25,
      completed: true,
      taskId: null,
    })
    expect(s.id).toBeTruthy()
    expect(await repo.listSince(new Date('2026-10-01'))).toHaveLength(1)
  })

  it('excludes sessions before the date', async () => {
    await repo.record({
      mode: 'work',
      startedAt: new Date('2026-10-01T09:00:00'),
      endedAt: new Date('2026-10-01T09:25:00'),
      durationMin: 25,
      completed: true,
      taskId: null,
    })
    expect(await repo.listSince(new Date('2026-10-02'))).toHaveLength(0)
  })

  it('sums only completed work minutes', async () => {
    const base = {
      startedAt: new Date('2026-10-03T09:00:00'),
      endedAt: new Date('2026-10-03T09:25:00'),
      taskId: null,
    }
    await repo.record({ ...base, mode: 'work', durationMin: 25, completed: true })
    await repo.record({ ...base, mode: 'work', durationMin: 10, completed: false })
    await repo.record({ ...base, mode: 'break', durationMin: 5, completed: true })
    expect(await repo.totalCompletedWorkMinutes(new Date('2026-10-01'))).toBe(25)
  })
})
