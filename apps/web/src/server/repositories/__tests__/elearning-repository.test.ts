import { describe, it, expect, beforeEach } from 'vitest'
import { InMemoryElearningRepository } from '../in-memory-elearning-repository'
import type { ElearningItemInput } from '@/services/elearning/types'

function item(overrides: Partial<ElearningItemInput> = {}): ElearningItemInput {
  return {
    course: 'PBL',
    title: 'Làm PBL',
    dueAt: null,
    url: null,
    type: 'task',
    source: 'csv',
    externalId: null,
    ...overrides,
  }
}

describe('InMemoryElearningRepository', () => {
  let repo: InMemoryElearningRepository

  beforeEach(() => {
    repo = new InMemoryElearningRepository()
  })

  it('starts empty', async () => {
    expect(await repo.count()).toBe(0)
  })

  it('saves items with an id and import timestamp', async () => {
    const saved = await repo.save([item()])
    expect(saved[0].id).toBeTruthy()
    expect(saved[0].importedAt).toBeInstanceOf(Date)
  })

  it('lists saved items', async () => {
    await repo.save([item({ title: 'A' }), item({ title: 'B' })])
    expect(await repo.list()).toHaveLength(2)
  })

  it('filters by type', async () => {
    await repo.save([item({ title: 'A', type: 'task' }), item({ title: 'B', type: 'course' })])
    expect(await repo.listByType('course')).toHaveLength(1)
  })

  it('returns an empty array when saving nothing', async () => {
    expect(await repo.save([])).toEqual([])
  })
})
