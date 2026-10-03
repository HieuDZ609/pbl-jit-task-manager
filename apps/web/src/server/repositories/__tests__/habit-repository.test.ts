import { describe, it, expect, beforeEach } from 'vitest'
import { InMemoryHabitRepository } from '../in-memory-habit-repository'

describe('InMemoryHabitRepository', () => {
  let repo: InMemoryHabitRepository
  const day = new Date('2026-10-03T08:00:00')

  beforeEach(() => {
    repo = new InMemoryHabitRepository()
  })

  it('creates a habit with defaults', async () => {
    const h = await repo.create({ name: 'Uống nước' })
    expect(h.frequency).toBe('daily')
    expect(h.targetCount).toBe(1)
    expect(h.archived).toBe(false)
  })

  it('lists only active habits', async () => {
    const a = await repo.create({ name: 'A' })
    await repo.create({ name: 'B' })
    await repo.archive(a.id)
    const active = await repo.listActive()
    expect(active.map((h) => h.name)).toEqual(['B'])
  })

  it('returns null for a missing habit', async () => {
    expect(await repo.findById('nope')).toBeNull()
  })

  it('checks in and increments the count for the same day', async () => {
    const h = await repo.create({ name: 'A' })
    await repo.checkIn(h.id, day)
    const log = await repo.checkIn(h.id, day)
    expect(log.count).toBe(2)
  })

  it('keeps separate logs per day', async () => {
    const h = await repo.create({ name: 'A' })
    await repo.checkIn(h.id, day)
    const log = await repo.checkIn(h.id, new Date('2026-10-04T08:00:00'))
    expect(log.count).toBe(1)
  })

  it('throws when checking in an unknown habit', async () => {
    await expect(repo.checkIn('nope', day)).rejects.toThrow()
  })

  it('sets an explicit count', async () => {
    const h = await repo.create({ name: 'A' })
    const log = await repo.setCount(h.id, day, 5)
    expect(log.count).toBe(5)
  })

  it('lists logs for a habit', async () => {
    const h = await repo.create({ name: 'A' })
    await repo.checkIn(h.id, day)
    await repo.checkIn(h.id, new Date('2026-10-01T08:00:00'))
    expect(await repo.logsFor(h.id)).toHaveLength(2)
  })

  it('returns empty logs for an unknown habit', async () => {
    expect(await repo.logsFor('nope')).toEqual([])
  })
})
