import { describe, it, expect, beforeEach } from 'vitest'
import { InMemoryTaskRepository } from '../in-memory-task-repository'

describe('InMemoryTaskRepository', () => {
  let repo: InMemoryTaskRepository

  beforeEach(() => {
    repo = new InMemoryTaskRepository()
  })

  it('creates and returns a task', async () => {
    const created = await repo.create({ title: 'Write report' })
    expect(created.id).toBeTruthy()
    const found = await repo.findById(created.id)
    expect(found?.title).toBe('Write report')
  })

  it('updates a task', async () => {
    const t = await repo.create({ title: 'A' })
    const updated = await repo.update(t.id, { title: 'B' })
    expect(updated.title).toBe('B')
  })

  it('soft deletes a task and hides it from list', async () => {
    const t = await repo.create({ title: 'A' })
    await repo.softDelete(t.id)
    expect(await repo.findById(t.id)).toBeNull()
    expect(await repo.list()).toEqual([])
  })

  it('marks done and sets doneAt', async () => {
    const t = await repo.create({ title: 'A' })
    const done = await repo.setDone(t.id, true)
    expect(done.isDone).toBe(true)
    expect(done.doneAt).not.toBeNull()
  })

  it('unmarking done clears doneAt', async () => {
    const t = await repo.create({ title: 'A' })
    await repo.setDone(t.id, true)
    const undone = await repo.setDone(t.id, false)
    expect(undone.doneAt).toBeNull()
  })

  it('lists subtasks of a parent', async () => {
    const parent = await repo.create({ title: 'Parent' })
    await repo.create({ title: 'Child 1', parentId: parent.id })
    await repo.create({ title: 'Child 2', parentId: parent.id })
    await repo.create({ title: 'Other' })
    const children = await repo.listSubtasks(parent.id)
    expect(children).toHaveLength(2)
  })

  it('filters list by eisenhower quadrant', async () => {
    await repo.create({ title: 'A1', eisenhowerQuadrant: 'A' })
    await repo.create({ title: 'B1', eisenhowerQuadrant: 'B' })
    const aTasks = await repo.list({ eisenhowerQuadrant: 'A' })
    expect(aTasks.map((t) => t.title)).toEqual(['A1'])
  })

  it('throws on update of missing task', async () => {
    await expect(repo.update('nope', { title: 'x' })).rejects.toThrow()
  })

  it('toggles myDayAt', async () => {
    const t = await repo.create({ title: 'A' })
    const on = await repo.setMyDay(t.id, new Date('2026-10-03T00:00:00.000Z'))
    expect(on.myDayAt).not.toBeNull()
    const off = await repo.setMyDay(t.id, null)
    expect(off.myDayAt).toBeNull()
  })
})
