// Test repository không cần DOM, và phải chạy dưới Node để `import.meta.url`
// là URL `file:` — `defaultMigrationsFolder()` suy ra đường dẫn từ đó.
// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { users } from '@pbl/db'
import { createDb } from '@pbl/db/client'
import { runMigrations } from '@pbl/db/scripts/migrate'

import type { RecordFocusSessionInput } from '../focus-session-repository'
import type { ElearningItemInput } from '@/services/elearning/types'
import type { ChecklistRepository } from '../checklist-repository'
import type { ElearningRepository } from '../elearning-repository'
import type { FolderListRepository } from '../folder-list-repository'
import type { FocusSessionRepository } from '../focus-session-repository'
import type { HabitRepository } from '../habit-repository'
import type { ReminderRepository } from '../reminder-repository'
import type { TaskRepository } from '../task-repository'
import { InMemoryChecklistRepository } from '../in-memory-checklist-repository'
import { InMemoryElearningRepository } from '../in-memory-elearning-repository'
import { InMemoryFocusSessionRepository } from '../in-memory-focus-session-repository'
import { InMemoryFolderListRepository } from '../in-memory-folder-list-repository'
import { InMemoryHabitRepository } from '../in-memory-habit-repository'
import { InMemoryReminderRepository } from '../in-memory-reminder-repository'
import { InMemoryTaskRepository } from '../in-memory-task-repository'
import { DrizzleChecklistRepository } from '../drizzle-checklist-repository'
import { DrizzleFolderListRepository } from '../drizzle-folder-list-repository'
import { DrizzleTaskRepository } from '../drizzle-task-repository'
import { DrizzleElearningRepository } from '../drizzle-elearning-repository'
import { DrizzleFocusSessionRepository } from '../drizzle-focus-session-repository'
import { DrizzleHabitRepository } from '../drizzle-habit-repository'
import { DrizzleReminderRepository } from '../drizzle-reminder-repository'

type Bundle = {
  tasks: TaskRepository
  checklists: ChecklistRepository
  folderLists: FolderListRepository
  habits: HabitRepository
  focusSessions: FocusSessionRepository
  reminders: ReminderRepository
  elearning: ElearningRepository
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
        habits: new InMemoryHabitRepository(),
        focusSessions: new InMemoryFocusSessionRepository(),
        reminders: new InMemoryReminderRepository(),
        elearning: new InMemoryElearningRepository(),
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
      habits: new DrizzleHabitRepository(handle.db, user.id),
      focusSessions: new DrizzleFocusSessionRepository(handle.db, user.id),
      reminders: new DrizzleReminderRepository(handle.db, user.id),
      elearning: new DrizzleElearningRepository(handle.db, user.id),
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

  describe('habits', () => {
    const DAY = new Date('2026-10-05T00:00:00.000Z')

    it('create điền default và trả habit vừa tạo', async () => {
      const habit = await repos().habits.create({ name: 'Uống nước' })

      expect(habit.name).toBe('Uống nước')
      expect(habit.frequency).toBe('daily')
      expect(habit.targetCount).toBe(1)
      expect(habit.color).toBeNull()
      expect(habit.icon).toBeNull()
      expect(habit.archived).toBe(false)
      expect(habit.startDate).toBeInstanceOf(Date)
    })

    it('create nhận frequency, targetCount và color', async () => {
      const habit = await repos().habits.create({
        name: 'Tập gym',
        frequency: 'weekly',
        targetCount: 3,
        color: '#ff0000',
      })

      expect(habit).toMatchObject({ frequency: 'weekly', targetCount: 3, color: '#ff0000' })
    })

    it('listActive không trả habit đã archive', async () => {
      const { habits } = repos()
      const active = await habits.create({ name: 'Còn sống' })
      const gone = await habits.create({ name: 'Đã archive' })
      await habits.archive(gone.id)

      const ids = (await habits.listActive()).map((h) => h.id)
      expect(ids).toEqual([active.id])
    })

    it('archive ném lỗi với id không tồn tại', async () => {
      await expect(repos().habits.archive(MISSING_ID)).rejects.toThrow(/not found/i)
    })

    it('checkIn cộng dồn trong cùng một ngày, không tạo log mới', async () => {
      const { habits } = repos()
      const habit = await habits.create({ name: 'Uống nước' })

      await habits.checkIn(habit.id, DAY)
      await habits.checkIn(habit.id, DAY)

      const logs = await habits.logsFor(habit.id)
      expect(logs).toHaveLength(1)
      expect(logs[0].count).toBe(2)
    })

    it('checkIn với increment tùy ý', async () => {
      const { habits } = repos()
      const habit = await habits.create({ name: 'Chốt đẩy' })
      await habits.checkIn(habit.id, DAY, 3)
      await habits.checkIn(habit.id, DAY, 2)

      expect((await habits.logsFor(habit.id))[0].count).toBe(5)
    })

    it('checkIn tách log theo từng ngày', async () => {
      const { habits } = repos()
      const habit = await habits.create({ name: 'Đọc sách' })
      await habits.checkIn(habit.id, DAY)
      await habits.checkIn(habit.id, new Date('2026-10-06T00:00:00.000Z'))

      expect(await habits.logsFor(habit.id)).toHaveLength(2)
    })

    it('checkIn/setCount ném lỗi khi habit không tồn tại', async () => {
      const { habits } = repos()
      await expect(habits.checkIn(MISSING_ID, DAY)).rejects.toThrow(/not found/i)
      await expect(habits.setCount(MISSING_ID, DAY, 1)).rejects.toThrow(/not found/i)
    })

    it('setCount ghi đè giá trị đã có', async () => {
      const { habits } = repos()
      const habit = await habits.create({ name: 'Undo check-in' })
      await habits.checkIn(habit.id, DAY, 4)
      await habits.setCount(habit.id, DAY, 0)

      const logs = await habits.logsFor(habit.id)
      expect(logs).toHaveLength(1)
      expect(logs[0].count).toBe(0)
    })

    it('setCount tạo log khi ngày đó chưa có', async () => {
      const { habits } = repos()
      const habit = await habits.create({ name: 'Set thẳng' })
      await habits.setCount(habit.id, DAY, 2)

      expect((await habits.logsFor(habit.id))[0].count).toBe(2)
    })
  })

  describe('focusSessions', () => {
    const session = (over: Partial<RecordFocusSessionInput> = {}) => ({
      mode: 'work' as const,
      startedAt: new Date('2026-10-05T01:00:00.000Z'),
      endedAt: new Date('2026-10-05T01:25:00.000Z'),
      durationMin: 25,
      completed: true,
      taskId: null,
      ...over,
    })

    it('record trả về phiên vừa lưu kèm id', async () => {
      const saved = await repos().focusSessions.record(session())

      expect(saved.id).toMatch(/^[0-9a-f-]{36}$/)
      expect(saved.durationMin).toBe(25)
      expect(saved.completed).toBe(true)
      expect(saved.taskId).toBeNull()
      expect(saved.startedAt).toBeInstanceOf(Date)
    })

    it('listSince chỉ trả phiên bắt đầu từ mốc trở đi', async () => {
      const { focusSessions } = repos()
      await focusSessions.record(session({ startedAt: new Date('2026-10-01T00:00:00.000Z') }))
      await focusSessions.record(session({ startedAt: new Date('2026-10-05T00:00:00.000Z') }))

      const rows = await focusSessions.listSince(new Date('2026-10-03T00:00:00.000Z'))
      expect(rows).toHaveLength(1)
      expect(rows[0].startedAt.toISOString()).toBe('2026-10-05T00:00:00.000Z')
    })

    it('listSince chính xác tại ranh giới (bao gồm mốc)', async () => {
      const { focusSessions } = repos()
      const at = new Date('2026-10-05T00:00:00.000Z')
      await focusSessions.record(session({ startedAt: at }))

      expect(await focusSessions.listSince(at)).toHaveLength(1)
    })

    it('totalCompletedWorkMinutes chỉ cộng phiên work đã hoàn thành', async () => {
      const { focusSessions } = repos()
      await focusSessions.record(session({ mode: 'work', completed: true, durationMin: 25 }))
      await focusSessions.record(session({ mode: 'work', completed: false, durationMin: 50 }))
      await focusSessions.record(session({ mode: 'break', completed: true, durationMin: 5 }))

      expect(await focusSessions.totalCompletedWorkMinutes(new Date('2026-10-01T00:00:00.000Z'))).toBe(
        25,
      )
    })

    it('totalCompletedWorkMinutes bỏ qua phiên trước mốc', async () => {
      const { focusSessions } = repos()
      await focusSessions.record(
        session({ startedAt: new Date('2026-09-01T00:00:00.000Z'), durationMin: 90 }),
      )

      expect(await focusSessions.totalCompletedWorkMinutes(new Date('2026-10-01T00:00:00.000Z'))).toBe(
        0,
      )
    })
  })

  describe('reminders', () => {
    const DUE = new Date('2026-10-05T09:00:00.000Z')

    it('create điền default và trả reminder vừa tạo', async () => {
      const reminder = await repos().reminders.create({ title: 'Gọi mẹ', dueAt: DUE })

      expect(reminder.title).toBe('Gọi mẹ')
      expect(reminder.repeat).toBe('none')
      expect(reminder.done).toBe(false)
      expect(reminder.notifiedAt).toBeNull()
      expect(reminder.dueAt.toISOString()).toBe('2026-10-05T09:00:00.000Z')
    })

    it('create nhận repeat', async () => {
      const reminder = await repos().reminders.create({ title: 'Uống thuốc', dueAt: DUE, repeat: 'daily' })

      expect(reminder.repeat).toBe('daily')
    })

    it('list trả tất cả reminder', async () => {
      const { reminders } = repos()
      await reminders.create({ title: 'A', dueAt: DUE })
      await reminders.create({ title: 'B', dueAt: DUE })

      expect((await reminders.list()).map((r) => r.title)).toEqual(['A', 'B'])
    })

    it('markDone đánh dấu xong', async () => {
      const { reminders } = repos()
      const reminder = await reminders.create({ title: 'Xong', dueAt: DUE })

      await reminders.markDone(reminder.id)

      expect((await reminders.findById(reminder.id))?.done).toBe(true)
    })

    it('reschedule đổi giờ và xoá notifiedAt', async () => {
      const { reminders } = repos()
      const reminder = await reminders.create({ title: 'Dời', dueAt: DUE })
      await reminders.markNotified(reminder.id, new Date('2026-10-05T08:00:00.000Z'))
      const next = new Date('2026-10-06T09:00:00.000Z')

      await reminders.reschedule(reminder.id, next)

      const after = await reminders.findById(reminder.id)
      expect(after?.dueAt.toISOString()).toBe('2026-10-06T09:00:00.000Z')
      expect(after?.notifiedAt).toBeNull()
    })

    it('markNotified lưu thời điểm đã báo', async () => {
      const { reminders } = repos()
      const reminder = await reminders.create({ title: 'Đã báo', dueAt: DUE })
      const at = new Date('2026-10-05T08:59:00.000Z')

      await reminders.markNotified(reminder.id, at)

      expect((await reminders.findById(reminder.id))?.notifiedAt?.toISOString()).toBe(
        '2026-10-05T08:59:00.000Z',
      )
    })

    it('remove xoá hẳn reminder', async () => {
      const { reminders } = repos()
      const reminder = await reminders.create({ title: 'Xoá', dueAt: DUE })

      await reminders.remove(reminder.id)

      expect(await reminders.findById(reminder.id)).toBeNull()
      expect(await reminders.list()).toEqual([])
    })

    it('mọi thao tác trên id không tồn tại đều ném lỗi', async () => {
      const { reminders } = repos()
      await expect(reminders.markDone(MISSING_ID)).rejects.toThrow(/not found/i)
      await expect(reminders.reschedule(MISSING_ID, DUE)).rejects.toThrow(/not found/i)
      await expect(reminders.remove(MISSING_ID)).rejects.toThrow(/not found/i)
      await expect(reminders.markNotified(MISSING_ID, DUE)).rejects.toThrow(/not found/i)
    })
  })

  describe('elearning', () => {
    const item = (over: Partial<ElearningItemInput> = {}): ElearningItemInput => ({
      course: 'Lập trình',
      title: 'Bài 1',
      dueAt: '2026-10-10',
      url: null,
      type: 'task',
      source: 'csv',
      externalId: null,
      ...over,
    })

    it('save trả về item vừa lưu kèm id và importedAt', async () => {
      const saved = await repos().elearning.save([item()])

      expect(saved).toHaveLength(1)
      expect(saved[0].id).toMatch(/^[0-9a-f-]{36}$/)
      expect(saved[0].title).toBe('Bài 1')
      expect(saved[0].importedAt).toBeInstanceOf(Date)
    })

    it('save giữ nguyên dueAt dạng chuỗi ngày, không đổi sang Date', async () => {
      const saved = await repos().elearning.save([item({ dueAt: '2026-10-10' })])

      expect(saved[0].dueAt).toBe('2026-10-10')
    })

    it('save chấp nhận dueAt và externalId null', async () => {
      const saved = await repos().elearning.save([item({ dueAt: null, externalId: null })])

      expect(saved[0].dueAt).toBeNull()
      expect(saved[0].externalId).toBeNull()
    })

    it('save nhiều item một lượt', async () => {
      const saved = await repos().elearning.save([item({ title: 'A' }), item({ title: 'B' })])

      expect(saved).toHaveLength(2)
      expect(await repos().elearning.count()).toBe(2)
    })

    it('list trả toàn bộ và listByType lọc theo loại', async () => {
      const { elearning } = repos()
      await elearning.save([item({ title: 'Task 1', type: 'task' })])
      await elearning.save([item({ title: 'Course 1', type: 'course' })])

      expect(await elearning.list()).toHaveLength(2)
      const courses = await elearning.listByType('course')
      expect(courses.map((r) => r.title)).toEqual(['Course 1'])
    })

    it('count bằng 0 khi chưa có gì', async () => {
      expect(await repos().elearning.count()).toBe(0)
    })
  })

}
