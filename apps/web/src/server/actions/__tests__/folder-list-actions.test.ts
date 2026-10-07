import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

vi.mock('@/server/repositories', async () => {
  const { mockInMemoryRepos } = await import(
    '@/server/repositories/__tests__/in-memory-bundle'
  )
  return mockInMemoryRepos()()
})

import { resetInMemoryRepos } from '@/server/repositories/__tests__/in-memory-bundle'

/** Store đã mock được cache trên globalThis nên mỗi test phải xoá để bắt đầu rỗng. */
async function freshActions() {
  vi.resetModules()
  resetInMemoryRepos()
  return import('../folder-list-actions')
}

describe('folder/list actions', () => {
  beforeEach(() => {
    vi.resetModules()
    resetInMemoryRepos()
  })

  it('tạo folder, cắt khoảng trắng thừa', async () => {
    const { createFolder } = await freshActions()
    const folder = await createFolder('  Việc  ')
    expect(folder.name).toBe('Việc')
  })

  it('từ chối folder trùng tên', async () => {
    const { createFolder } = await freshActions()
    await createFolder('Việc')
    await expect(createFolder('Việc')).rejects.toThrow(/đã tồn tại/i)
  })

  it('cho phép hai list trùng tên ở hai folder khác nhau', async () => {
    const { createFolder, createList } = await freshActions()
    const a = await createFolder('A')
    const b = await createFolder('B')
    await expect(createList('Việc', a.id)).resolves.toMatchObject({ name: 'Việc' })
    await expect(createList('Việc', b.id)).resolves.toMatchObject({ name: 'Việc' })
  })

  it('từ chối list trùng tên trong cùng folder', async () => {
    const { createFolder, createList } = await freshActions()
    const folder = await createFolder('A')
    await createList('Việc', folder.id)
    await expect(createList('Việc', folder.id)).rejects.toThrow(/đã tồn tại/i)
  })

  it('từ chối tên rỗng hoặc quá dài', async () => {
    const { createFolder } = await freshActions()
    await expect(createFolder('   ')).rejects.toThrow()
    await expect(createFolder('x'.repeat(101))).rejects.toThrow()
  })

  it('từ chối list thuộc folder không tồn tại', async () => {
    const { createList } = await freshActions()
    await expect(createList('Việc', '11111111-1111-4111-8111-111111111111')).rejects.toThrow(
      /không tồn tại|không thể/i,
    )
  })

  it('đổi tên folder và giữ nguyên id', async () => {
    const { createFolder, renameFolder, getFolderTree } = await freshActions()
    const folder = await createFolder('Cũ')
    const renamed = await renameFolder(folder.id, 'Mới')
    expect(renamed.id).toBe(folder.id)
    expect(renamed.name).toBe('Mới')
    expect((await getFolderTree())[0]?.name).toBe('Mới')
  })

  it('từ chối đổi tên folder thành tên đã có', async () => {
    const { createFolder, renameFolder } = await freshActions()
    await createFolder('A')
    const b = await createFolder('B')
    await expect(renameFolder(b.id, 'A')).rejects.toThrow(/đã tồn tại/i)
  })

  it('đổi tên được list', async () => {
    const { createList, renameList } = await freshActions()
    const list = await createList('Cũ')
    expect((await renameList(list.id, 'Mới')).name).toBe('Mới')
  })

  it('xoá folder kéo theo list bên trong', async () => {
    const { createFolder, createList, deleteFolder, getFolderTree } = await freshActions()
    const folder = await createFolder('A')
    await createList('Việc', folder.id)
    await deleteFolder(folder.id)
    expect(await getFolderTree()).toEqual([])
  })

  it('xoá list không ảnh hưởng list khác', async () => {
    const { createList, deleteList, getRootLists } = await freshActions()
    const keep = await createList('Giữ')
    const drop = await createList('Xoá')
    await deleteList(drop.id)
    expect((await getRootLists()).map((l) => l.id)).toEqual([keep.id])
  })

  it('báo lỗi rõ ràng khi xoá folder không tồn tại', async () => {
    const { deleteFolder } = await freshActions()
    await expect(deleteFolder('11111111-1111-4111-8111-111111111111')).rejects.toThrow(
      /không tồn tại/i,
    )
  })
})