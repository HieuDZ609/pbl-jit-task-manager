import { describe, it, expect, beforeEach } from 'vitest'
import { InMemoryChecklistRepository } from '../in-memory-checklist-repository'

describe('InMemoryChecklistRepository', () => {
  let repo: InMemoryChecklistRepository

  beforeEach(() => {
    repo = new InMemoryChecklistRepository()
  })

  it('creates a checklist item for a task', async () => {
    const item = await repo.create('task-1', 'Read spec')
    expect(item.title).toBe('Read spec')
    expect(item.taskId).toBe('task-1')
    expect(item.isDone).toBe(false)
  })

  it('lists items of a task in sort order', async () => {
    await repo.create('task-1', 'b')
    await repo.create('task-1', 'a')
    await repo.create('task-2', 'other')
    const items = await repo.listByTask('task-1')
    expect(items.map((i) => i.title)).toEqual(['b', 'a'])
  })

  it('toggles done', async () => {
    const item = await repo.create('task-1', 'x')
    const done = await repo.setDone(item.id, true)
    expect(done.isDone).toBe(true)
  })

  it('removes an item', async () => {
    const item = await repo.create('task-1', 'x')
    await repo.remove(item.id)
    expect(await repo.listByTask('task-1')).toEqual([])
  })

  it('throws when toggling missing item', async () => {
    await expect(repo.setDone('nope', true)).rejects.toThrow()
  })
})
