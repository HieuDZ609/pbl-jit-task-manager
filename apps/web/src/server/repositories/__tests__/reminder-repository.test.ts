import { describe, it, expect, beforeEach } from 'vitest'
import { InMemoryReminderRepository } from '../in-memory-reminder-repository'

describe('InMemoryReminderRepository', () => {
  let repo: InMemoryReminderRepository
  const dueAt = new Date('2026-10-03T10:00:00')

  beforeEach(() => {
    repo = new InMemoryReminderRepository()
  })

  it('creates a reminder with defaults', async () => {
    const r = await repo.create({ title: 'Gọi mẹ', dueAt })
    expect(r.repeat).toBe('none')
    expect(r.done).toBe(false)
    expect(r.notifiedAt).toBeNull()
  })

  it('keeps the repeat value', async () => {
    const r = await repo.create({ title: 'A', dueAt, repeat: 'daily' })
    expect(r.repeat).toBe('daily')
  })

  it('lists all reminders', async () => {
    await repo.create({ title: 'A', dueAt })
    await repo.create({ title: 'B', dueAt })
    expect(await repo.list()).toHaveLength(2)
  })

  it('finds by id', async () => {
    const r = await repo.create({ title: 'A', dueAt })
    expect((await repo.findById(r.id))?.title).toBe('A')
  })

  it('returns null for a missing reminder', async () => {
    expect(await repo.findById('nope')).toBeNull()
  })

  it('marks a reminder done', async () => {
    const r = await repo.create({ title: 'A', dueAt })
    await repo.markDone(r.id)
    expect((await repo.findById(r.id))?.done).toBe(true)
  })

  it('reschedules a reminder', async () => {
    const r = await repo.create({ title: 'A', dueAt })
    await repo.reschedule(r.id, new Date('2026-10-03T11:00:00'))
    expect((await repo.findById(r.id))?.dueAt.toISOString()).toBe(
      new Date('2026-10-03T11:00:00').toISOString(),
    )
  })

  it('records the notification timestamp', async () => {
    const r = await repo.create({ title: 'A', dueAt })
    await repo.markNotified(r.id, new Date('2026-10-03T09:59:00'))
    expect((await repo.findById(r.id))?.notifiedAt).not.toBeNull()
  })

  it('removes a reminder', async () => {
    const r = await repo.create({ title: 'A', dueAt })
    await repo.remove(r.id)
    expect(await repo.list()).toHaveLength(0)
  })

  it('throws when completing a missing reminder', async () => {
    await expect(repo.markDone('nope')).rejects.toThrow()
  })

  it('throws when rescheduling a missing reminder', async () => {
    await expect(repo.reschedule('nope', dueAt)).rejects.toThrow()
  })
})
