import { describe, it, expect, beforeEach } from 'vitest'
import { InMemoryFolderListRepository } from '../in-memory-folder-list-repository'

describe('InMemoryFolderListRepository', () => {
  let repo: InMemoryFolderListRepository

  beforeEach(() => {
    repo = new InMemoryFolderListRepository()
  })

  it('creates a folder', async () => {
    const f = await repo.createFolder('Học kỳ 2')
    expect(f.name).toBe('Học kỳ 2')
  })

  it('creates a list inside a folder', async () => {
    const f = await repo.createFolder('Học kỳ 2')
    const l = await repo.createList('Bài tập', f.id)
    expect(l.folderId).toBe(f.id)
  })

  it('creates a top-level list without folder', async () => {
    const l = await repo.createList('Cá nhân')
    expect(l.folderId).toBeNull()
  })

  it('rejects a list inside a list (max 2 levels)', async () => {
    const f = await repo.createFolder('F')
    const l = await repo.createList('L', f.id)
    await expect(repo.createList('Nested', l.id)).rejects.toThrow()
  })

  it('lists folders and their lists', async () => {
    const f = await repo.createFolder('F')
    await repo.createList('L1', f.id)
    await repo.createList('L2', f.id)
    await repo.createList('Top')
    const tree = await repo.tree()
    expect(tree).toHaveLength(1)
    expect(tree[0].lists).toHaveLength(2)
  })

  it('removes a folder with its lists', async () => {
    const f = await repo.createFolder('F')
    await repo.createList('L', f.id)
    await repo.removeFolder(f.id)
    expect(await repo.tree()).toEqual([])
  })
})
