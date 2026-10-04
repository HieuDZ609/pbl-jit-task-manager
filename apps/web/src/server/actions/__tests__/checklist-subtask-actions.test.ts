import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

async function fresh() {
  vi.resetModules()
  delete (globalThis as { __pblRepos?: unknown }).__pblRepos
  const [checklist, subtask, tasks] = await Promise.all([
    import('../checklist-actions'),
    import('../subtask-actions'),
    import('../task-actions'),
  ])
  return { checklist, subtask, tasks }
}

describe('checklist actions', () => {
  beforeEach(() => {
    vi.resetModules()
    delete (globalThis as { __pblRepos?: unknown }).__pblRepos
  })

  it('thêm item, trim tên, gắn đúng taskId', async () => {
    const { checklist, tasks } = await fresh()
    const task = await tasks.createTask('Việc lớn')
    const item = await checklist.addChecklistItem(task.id, '  Mua thêm giấy  ')
    expect(item).toMatchObject({ taskId: task.id, title: 'Mua thêm giấy', isDone: false })
  })

  it('từ chối item rỗng hoặc quá dài', async () => {
    const { checklist, tasks } = await fresh()
    const task = await tasks.createTask('Việc lớn')
    await expect(checklist.addChecklistItem(task.id, '   ')).rejects.toThrow()
    await expect(checklist.addChecklistItem(task.id, 'x'.repeat(101))).rejects.toThrow()
  })

  it('từ chối taskId không phải uuid', async () => {
    const { checklist } = await fresh()
    await expect(checklist.addChecklistItem('abc', 'Mục')).rejects.toThrow()
  })

  it('từ chối thêm item vào task không tồn tại', async () => {
    const { checklist } = await fresh()
    await expect(
      checklist.addChecklistItem('11111111-1111-4111-8111-111111111111', 'Mục'),
    ).rejects.toThrow(/không tồn tại/i)
  })

  it('list chỉ trả item của task được hỏi', async () => {
    const { checklist, tasks } = await fresh()
    const a = await tasks.createTask('A')
    const b = await tasks.createTask('B')
    await checklist.addChecklistItem(a.id, 'của A')
    await checklist.addChecklistItem(b.id, 'của B')
    expect((await checklist.listChecklistItems(a.id)).map((i) => i.title)).toEqual(['của A'])
  })

  it('đánh dấu item xong', async () => {
    const { checklist, tasks } = await fresh()
    const task = await tasks.createTask('A')
    const item = await checklist.addChecklistItem(task.id, 'Mục')
    expect((await checklist.setChecklistItemDone(item.id, true)).isDone).toBe(true)
  })

  it('xoá item thì không còn trong list', async () => {
    const { checklist, tasks } = await fresh()
    const task = await tasks.createTask('A')
    const item = await checklist.addChecklistItem(task.id, 'Mục')
    await checklist.removeChecklistItem(item.id)
    expect(await checklist.listChecklistItems(task.id)).toEqual([])
  })

  it('báo lỗi khi thao tác với item không tồn tại', async () => {
    const { checklist } = await fresh()
    const ghost = '11111111-1111-4111-8111-111111111111'
    await expect(checklist.setChecklistItemDone(ghost, true)).rejects.toThrow(/không tồn tại/i)
    await expect(checklist.removeChecklistItem(ghost)).rejects.toThrow(/không tồn tại/i)
  })
})

describe('subtask actions', () => {
  beforeEach(() => {
    vi.resetModules()
    delete (globalThis as { __pblRepos?: unknown }).__pblRepos
  })

  it('tạo subtask với parentId trỏ về task cha', async () => {
    const { subtask, tasks } = await fresh()
    const parent = await tasks.createTask('Cha')
    const child = await subtask.addSubtask(parent.id, 'Việc con')
    expect(child).toMatchObject({ parentId: parent.id, title: 'Việc con', isDone: false })
  })

  it('subtask kế thừa listId của task cha', async () => {
    const { subtask, tasks } = await fresh()
    const parent = await tasks.createTask('Cha')
    const child = await subtask.addSubtask(parent.id, 'Việc con')
    expect(child.listId).toBe(parent.listId)
  })

  it('từ chối subtask cho task cha không tồn tại', async () => {
    const { subtask } = await fresh()
    await expect(
      subtask.addSubtask('11111111-1111-4111-8111-111111111111', 'Việc con'),
    ).rejects.toThrow(/không tồn tại/i)
  })

  it('chặn subtask của subtask (tối đa 2 cấp)', async () => {
    const { subtask, tasks } = await fresh()
    const parent = await tasks.createTask('Cha')
    const child = await subtask.addSubtask(parent.id, 'Con')
    await expect(subtask.addSubtask(child.id, 'Cháu')).rejects.toThrow(/2 cấp|tối đa/i)
  })

  it('listSubtasks không trả task đã xoá mềm', async () => {
    const { subtask, tasks } = await fresh()
    const parent = await tasks.createTask('Cha')
    const child = await subtask.addSubtask(parent.id, 'Con')
    await tasks.deleteTask(child.id)
    expect(await subtask.listSubtasks(parent.id)).toEqual([])
  })

  it('toggle subtask dùng chung setTaskDone và phản ánh trong listSubtasks', async () => {
    const { subtask, tasks } = await fresh()
    const parent = await tasks.createTask('Cha')
    const child = await subtask.addSubtask(parent.id, 'Con')
    await tasks.setTaskDone(child.id, true)
    expect((await subtask.listSubtasks(parent.id)).map((t) => t.isDone)).toEqual([true])
  })
})