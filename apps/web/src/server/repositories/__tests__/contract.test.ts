// Test repository không cần DOM, và phải chạy dưới Node để `import.meta.url`
// là URL `file:` — `defaultMigrationsFolder()` suy ra đường dẫn từ đó.
// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { users } from '@pbl/db'
import { createDb } from '@pbl/db/client'
import { runMigrations } from '@pbl/db/scripts/migrate'

import type { ChecklistRepository } from '../checklist-repository'
import type { FolderListRepository } from '../folder-list-repository'
import type { TaskRepository } from '../task-repository'
import { InMemoryChecklistRepository } from '../in-memory-checklist-repository'
import { InMemoryFolderListRepository } from '../in-memory-folder-list-repository'
import { InMemoryTaskRepository } from '../in-memory-task-repository'
import { DrizzleChecklistRepository } from '../drizzle-checklist-repository'
import { DrizzleFolderListRepository } from '../drizzle-folder-list-repository'
import { DrizzleTaskRepository } from '../drizzle-task-repository'

type Bundle = {
  tasks: TaskRepository
  checklists: ChecklistRepository
  folderLists: FolderListRepository
}

type Harness = { bundle: Bundle; teardown: () => Promise<void> }

/**
 * Id hợp lệ về cú pháp UUID nhưng không có bản ghi nào.
 *
 * Cố tình **không** dùng chuỗi bất kỳ kiểu `'khong-co'`: cột `uuid` của Postgres
 * chặn ở tầng input trước khi câu query chạy, nên test sẽ đo hành vi của Postgres
 * chứ không đo hợp đồng của repository. Khác biệt này được ghi lại thay vì giấu:
 * id trong thực tế luôn do DB sinh ra nên luôn là UUID hợp lệ.
 */
const MISSING_ID = '00000000-0000-0000-0000-000000000000'

const flavors: Array<[string, () => Promise<Harness>]> = [
  [
    'in-memory',
    async () => ({
      bundle: {
        tasks: new InMemoryTaskRepository(),
        checklists: new InMemoryChecklistRepository(),
        folderLists: new InMemoryFolderListRepository(),
      },
      teardown: async () => {},
    }),
  ],
  ['drizzle', drizzleHarness],
]

for (const [name, setup] of flavors) {
  describe(`repository contract — ${name}`, () => {
    let bundle: Bundle
    let teardown: () => Promise<void>

    beforeEach(async () => {
      const harness = await setup()
      bundle = harness.bundle
      teardown = harness.teardown
    })

    afterEach(async () => {
      await teardown()
    })

    contract(() => bundle)
  })
}

/** Dựng adapter Drizzle trên PGlite in-memory đã migrate, gắn vào một user. */
async function drizzleHarness(): Promise<Harness> {
  const handle = createDb({ driver: 'pglite', key: `contract-${Math.random()}` })
  await runMigrations(handle.db)
  const [user] = await handle.db
    .insert(users)
    .values({ email: `contract-${Math.random()}@pbl.local`, name: 'Contract User' })
    .returning()

  return {
    bundle: {
      tasks: new DrizzleTaskRepository(handle.db, user.id),
      checklists: new DrizzleChecklistRepository(handle.db, user.id),
      folderLists: new DrizzleFolderListRepository(handle.db, user.id),
    },
    teardown: () => handle.close(),
  }
}

/**
 * Bộ assert dùng chung cho mọi adapter — không nhắc tên adapter cụ thể.
 *
 * Task 10 yêu cầu "chạy cùng bộ test lên cả in-memory và Drizzle repo, kết quả
 * phải giống nhau". Nếu hành vi lệch, đúng một trong hai sẽ đỏ và ta biết ngay
 * adapter nào sai; đó là điều cần bắt.
 *
 * Phạm vi: chỉ *hành vi quan sát được* (giá trị trả về, lỗi ném ra). User scoping
 * là chiều kiểm tra riêng ở Task 12, vì adapter in-memory không có khái niệm user.
 */
function contract(repos: () => Bundle): void {
  describe('tasks', () => {
    it('create điền default và trả về task vừa tạo', async () => {
      const task = await repos().tasks.create({ title: 'Viết báo cáo' })

      expect(task.title).toBe('Viết báo cáo')
      expect(task.isDone).toBe(false)
      expect(task.doneAt ?? null).toBeNull()
      expect(task.deletedAt ?? null).toBeNull()
      expect(task.listId ?? null).toBeNull()
      expect(task.eisenhowerQuadrant ?? null).toBeNull()
    })

    it('create nhận đủ field tuỳ chọn', async () => {
      const task = await repos().tasks.create({
        title: 'Full',
        content: 'mô tả',
        eisenhowerQuadrant: 'A',
        dueAt: new Date('2026-10-10T09:00:00Z'),
        startAt: new Date('2026-10-09T09:00:00Z'),
        remindAt: new Date('2026-10-09T08:00:00Z'),
        myDayAt: new Date('2026-10-09T00:00:00Z'),
      })

      expect(task.content).toBe('mô tả')
      expect(task.eisenhowerQuadrant).toBe('A')
      expect(task.dueAt).toEqual(new Date('2026-10-10T09:00:00Z'))
      expect(task.myDayAt).toEqual(new Date('2026-10-09T00:00:00Z'))
    })

    it('update chỉ ghi đè field được truyền', async () => {
      const created = await repos().tasks.create({ title: 'Gốc', content: 'giữ lại' })

      const updated = await repos().tasks.update(created.id, { title: 'Đổi' })

      expect(updated.title).toBe('Đổi')
      expect(updated.content).toBe('giữ lại')
    })

    it('update ném lỗi khi id không tồn tại', async () => {
      await expect(repos().tasks.update(MISSING_ID, { title: 'Đổi' })).rejects.toThrow(/not found/i)
    })

    it('findById trả null với id lạ', async () => {
      expect(await repos().tasks.findById(MISSING_ID)).toBeNull()
    })

    it('findById trả null sau softDelete', async () => {
      const created = await repos().tasks.create({ title: 'Xoá mềm' })
      await repos().tasks.softDelete(created.id)

      expect(await repos().tasks.findById(created.id)).toBeNull()
    })

    it('list loại task đã soft-delete', async () => {
      await repos().tasks.create({ title: 'Còn' })
      const doomed = await repos().tasks.create({ title: 'Mất' })
      await repos().tasks.softDelete(doomed.id)

      expect((await repos().tasks.list()).map((r) => r.title)).toEqual(['Còn'])
    })

    it('list lọc theo quadrant, listId và isDone', async () => {
      const list = await repos().folderLists.createList('Việc')
      const a = await repos().tasks.create({ title: 'A', eisenhowerQuadrant: 'A', listId: list.id })
      await repos().tasks.create({ title: 'B', eisenhowerQuadrant: 'B', listId: list.id })
      await repos().tasks.create({ title: 'C', eisenhowerQuadrant: 'A' })

      const { tasks } = repos()
      expect((await tasks.list({ eisenhowerQuadrant: 'A' })).map((r) => r.title).sort()).toEqual(['A', 'C'])
      expect((await tasks.list({ listId: list.id })).map((r) => r.title).sort()).toEqual(['A', 'B'])
      expect((await tasks.list({ isDone: false })).map((r) => r.title).sort()).toEqual(['A', 'B', 'C'])

      await tasks.setDone(a.id, true)
      expect((await tasks.list({ isDone: true })).map((r) => r.title)).toEqual(['A'])
      expect((await tasks.list({ isDone: false })).map((r) => r.title).sort()).toEqual(['B', 'C'])
    })

    it('listSubtasks chỉ trả con của parent, bỏ qua task đã xoá', async () => {
      const parent = await repos().tasks.create({ title: 'Cha' })
      const child = await repos().tasks.create({ title: 'Con', parentId: parent.id })
      const orphan = await repos().tasks.create({ title: 'Mồ côi', parentId: parent.id })
      await repos().tasks.create({ title: 'Không phải con' })
      await repos().tasks.softDelete(orphan.id)

      const rows = await repos().tasks.listSubtasks(parent.id)

      expect(rows.map((r) => r.title)).toEqual(['Con'])
      expect(rows[0].id).toBe(child.id)
    })

    it('setDone(true) set doneAt, setDone(false) xoá doneAt', async () => {
      const created = await repos().tasks.create({ title: 'Done' })
      const { tasks } = repos()

      const done = await tasks.setDone(created.id, true)
      expect(done.isDone).toBe(true)
      expect(done.doneAt).toBeInstanceOf(Date)

      const undone = await tasks.setDone(created.id, false)
      expect(undone.isDone).toBe(false)
      expect(undone.doneAt ?? null).toBeNull()
    })

    it('setMyDay đặt và xoá myDayAt', async () => {
      const created = await repos().tasks.create({ title: 'MyDay' })
      const at = new Date('2026-10-09T00:00:00Z')

      expect((await repos().tasks.setMyDay(created.id, at)).myDayAt).toEqual(at)
      expect((await repos().tasks.setMyDay(created.id, null)).myDayAt ?? null).toBeNull()
    })

    it('softDelete ném lỗi với id không tồn tại', async () => {
      await expect(repos().tasks.softDelete(MISSING_ID)).rejects.toThrow(/not found/i)
    })
  })

  describe('folderLists', () => {
    it('createFolder trả folder với sortOrder tăng dần', async () => {
      const first = await repos().folderLists.createFolder('Công việc')
      const second = await repos().folderLists.createFolder('Cá nhân')

      expect(first.sortOrder).toBeLessThan(second.sortOrder)
    })

    it('createFolder từ chối trùng tên', async () => {
      await repos().folderLists.createFolder('Trùng')

      await expect(repos().folderLists.createFolder('Trùng')).rejects.toThrow(/đã tồn tại/)
    })

    it('createList trong folder phải có folder thật', async () => {
      await expect(repos().folderLists.createList('L', MISSING_ID)).rejects.toThrow(
        /không tồn tại/,
      )
    })

    it('createList từ chối trùng tên trong cùng phạm vi', async () => {
      await repos().folderLists.createList('Việc', null)

      await expect(repos().folderLists.createList('Việc', null)).rejects.toThrow(/đã tồn tại/)
    })

    it('cùng tên ở folder khác là hợp lệ', async () => {
      const a = await repos().folderLists.createFolder('A')
      await repos().folderLists.createList('Việc', a.id)
      const b = await repos().folderLists.createFolder('B')

      expect((await repos().folderLists.createList('Việc', b.id)).folderId).toBe(b.id)
    })

    it('tree gom list vào đúng folder', async () => {
      const folder = await repos().folderLists.createFolder('Công việc')
      await repos().folderLists.createList('Trong folder', folder.id)
      await repos().folderLists.createList('Ngoài folder', null)

      const tree = await repos().folderLists.tree()

      expect(tree).toHaveLength(1)
      expect(tree[0].name).toBe('Công việc')
      expect(tree[0].lists.map((l) => l.name)).toEqual(['Trong folder'])
    })

    it('rootLists chỉ trả list không có folder', async () => {
      const folder = await repos().folderLists.createFolder('Công việc')
      await repos().folderLists.createList('Trong folder', folder.id)
      await repos().folderLists.createList('Ngoài folder', null)

      expect((await repos().folderLists.rootLists()).map((l) => l.name)).toEqual(['Ngoài folder'])
    })

    it('removeFolder xoá luôn list bên trong', async () => {
      const folder = await repos().folderLists.createFolder('Công việc')
      const list = await repos().folderLists.createList('Trong folder', folder.id)

      await repos().folderLists.removeFolder(folder.id)

      expect(await repos().folderLists.findFolder(folder.id)).toBeNull()
      expect(await repos().folderLists.findList(list.id)).toBeNull()
      expect(await repos().folderLists.tree()).toEqual([])
    })

    it('removeList chỉ xoá list', async () => {
      const folder = await repos().folderLists.createFolder('Giữ')
      const list = await repos().folderLists.createList('Xoá', folder.id)

      await repos().folderLists.removeList(list.id)

      expect(await repos().folderLists.findList(list.id)).toBeNull()
      expect(await repos().folderLists.findFolder(folder.id)).not.toBeNull()
    })

    it('renameFolder chặn trùng tên với folder khác', async () => {
      const a = await repos().folderLists.createFolder('A')
      await repos().folderLists.createFolder('B')

      await expect(repos().folderLists.renameFolder(a.id, 'B')).rejects.toThrow(/đã tồn tại/)
    })

    it('renameList cho phép giữ nguyên tên của chính nó', async () => {
      const list = await repos().folderLists.createList('Việc', null)

      expect((await repos().folderLists.renameList(list.id, 'Việc')).name).toBe('Việc')
    })

    it('renameList chặn trùng tên trong cùng folder', async () => {
      const a = await repos().folderLists.createList('A', null)
      await repos().folderLists.createList('B', null)

      await expect(repos().folderLists.renameList(a.id, 'B')).rejects.toThrow(/đã tồn tại/)
    })

    it('rename ném lỗi với id không tồn tại', async () => {
      const { folderLists } = repos()

      await expect(folderLists.renameFolder(MISSING_ID, 'y')).rejects.toThrow(/không tồn tại/)
      await expect(folderLists.renameList(MISSING_ID, 'y')).rejects.toThrow(/không tồn tại/)
    })

    it('findFolder/findList trả null với id lạ', async () => {
      const { folderLists } = repos()

      expect(await folderLists.findFolder(MISSING_ID)).toBeNull()
      expect(await folderLists.findList(MISSING_ID)).toBeNull()
    })
  })

  describe('checklists', () => {
    /** DB có FK `task_id` → `tasks.id`, nên tạo task thật trước. */
    const withTask = () => repos().tasks.create({ title: 'Task cha' })

    it('create gắn taskId, isDone=false và sortOrder tăng dần', async () => {
      const task = await withTask()
      const first = await repos().checklists.create(task.id, 'Mục 1')
      const second = await repos().checklists.create(task.id, 'Mục 2')

      expect(first.taskId).toBe(task.id)
      expect(first.isDone).toBe(false)
      expect(first.sortOrder).toBeLessThan(second.sortOrder)
    })

    it('findById trả null với id lạ', async () => {
      expect(await repos().checklists.findById(MISSING_ID)).toBeNull()
    })

    it('listByTask chỉ trả item của task đó', async () => {
      const taskA = await withTask()
      const taskB = await withTask()
      await repos().checklists.create(taskA.id, 'A1')
      await repos().checklists.create(taskB.id, 'B1')

      expect((await repos().checklists.listByTask(taskA.id)).map((i) => i.title)).toEqual(['A1'])
    })

    it('setDone đổi trạng thái và trả về item', async () => {
      const item = await repos().checklists.create((await withTask()).id, 'Mục')

      expect((await repos().checklists.setDone(item.id, true)).isDone).toBe(true)
    })

    it('setDone/remove ném lỗi với id không tồn tại', async () => {
      const { checklists } = repos()

      await expect(checklists.setDone(MISSING_ID, true)).rejects.toThrow(/not found/i)
      await expect(checklists.remove(MISSING_ID)).rejects.toThrow(/not found/i)
    })

    it('remove xoá hẳn item', async () => {
      const task = await withTask()
      const item = await repos().checklists.create(task.id, 'Mục')

      await repos().checklists.remove(item.id)

      expect(await repos().checklists.findById(item.id)).toBeNull()
      expect(await repos().checklists.listByTask(task.id)).toEqual([])
    })
  })
}
