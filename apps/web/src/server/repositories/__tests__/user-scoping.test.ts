// @vitest-environment node
// Repo test cần PGlite (native + fs) nên phải chạy dưới Node, không phải jsdom.
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { users } from '@pbl/db'
import { createDb } from '@pbl/db/client'
import { runMigrations } from '@pbl/db/scripts/migrate'
import { randomUUID } from 'node:crypto'

import { DrizzleChecklistRepository } from '../drizzle-checklist-repository'
import { DrizzleElearningRepository } from '../drizzle-elearning-repository'
import { DrizzleFocusSessionRepository } from '../drizzle-focus-session-repository'
import { DrizzleFolderListRepository } from '../drizzle-folder-list-repository'
import { DrizzleHabitRepository } from '../drizzle-habit-repository'
import { DrizzleReminderRepository } from '../drizzle-reminder-repository'
import { DrizzleTaskRepository } from '../drizzle-task-repository'
import { InMemoryChecklistRepository } from '../in-memory-checklist-repository'
import { InMemoryElearningRepository } from '../in-memory-elearning-repository'
import { InMemoryFocusSessionRepository } from '../in-memory-focus-session-repository'
import { InMemoryFolderListRepository } from '../in-memory-folder-list-repository'
import { InMemoryHabitRepository } from '../in-memory-habit-repository'
import { InMemoryReminderRepository } from '../in-memory-reminder-repository'
import { InMemoryTaskRepository } from '../in-memory-task-repository'

/**
 * Chống rò dữ liệu giữa hai user (IDOR) — Task 10.
 *
 * Contract test kiểm tra "mọi repository hành xử như nhau", nhưng không kiểm tra
 * câu hỏi quan trọng nhất khi thêm `userId`: user A có thấy/ghi/xoá dữ liệu của
 * user B không. Những test này dựng hai user thật trên cùng một DB rồi thử vượt
 * ranh giới từ phía A.
 *
 * Vẫn chạy trên **cả** adapter Drizzle lẫn in-memory dù Task 11 đã chuyển nốt
 * (bundle `reposFor` giờ toàn Drizzle). Lý do giữ lại: đây là cách bảo vệ duy nhất
 * rằng hai user không dùng chung một instance — nếu ai đó vô tình đưa lại một
 * repo in-memory dùng chung, flavor in-memory vẫn phải bắt được dữ liệu rò.
 */

type Harness = {
  a: {
    tasks: DrizzleTaskRepository | InMemoryTaskRepository
    checklists: DrizzleChecklistRepository | InMemoryChecklistRepository
    folderLists: DrizzleFolderListRepository | InMemoryFolderListRepository
    habits: DrizzleHabitRepository | InMemoryHabitRepository
    focusSessions: DrizzleFocusSessionRepository | InMemoryFocusSessionRepository
    reminders: DrizzleReminderRepository | InMemoryReminderRepository
    elearning: DrizzleElearningRepository | InMemoryElearningRepository
  }
  b: {
    tasks: DrizzleTaskRepository | InMemoryTaskRepository
    checklists: DrizzleChecklistRepository | InMemoryChecklistRepository
    folderLists: DrizzleFolderListRepository | InMemoryFolderListRepository
    habits: DrizzleHabitRepository | InMemoryHabitRepository
    focusSessions: DrizzleFocusSessionRepository | InMemoryFocusSessionRepository
    reminders: DrizzleReminderRepository | InMemoryReminderRepository
    elearning: DrizzleElearningRepository | InMemoryElearningRepository
  }
}

/** Dựng cùng một kịch bản cho cả hai loại repo để so sánh công bằng. */
const FLAVORS = [
  {
    name: 'drizzle',
    build: async (): Promise<Harness> => {
      const { db, close } = createDb({ driver: 'pglite', key: randomUUID() })
      await runMigrations(db)
      const idA = randomUUID()
      const idB = randomUUID()
      await db.insert(users).values([
        { id: idA, email: `a-${idA}@example.test` },
        { id: idB, email: `b-${idB}@example.test` },
      ])

      const side = (userId: string) => ({
        tasks: new DrizzleTaskRepository(db, userId),
        checklists: new DrizzleChecklistRepository(db, userId),
        folderLists: new DrizzleFolderListRepository(db, userId),
        habits: new DrizzleHabitRepository(db, userId),
        focusSessions: new DrizzleFocusSessionRepository(db, userId),
        reminders: new DrizzleReminderRepository(db, userId),
        elearning: new DrizzleElearningRepository(db, userId),
      })
      const harness = { a: side(idA), b: side(idB) }
      closeAfter.push(close)
      return harness
    },
  },
  {
    name: 'in-memory',
    build: async (): Promise<Harness> => {
      // In-memory repo tự quản lý store riêng, nên hai "user" ở đây là hai
      // instance độc lập — mô phỏng đúng việc bundle tách instance theo user.
      const side = () => ({
        tasks: new InMemoryTaskRepository(),
        checklists: new InMemoryChecklistRepository(),
        folderLists: new InMemoryFolderListRepository(),
        habits: new InMemoryHabitRepository(),
        focusSessions: new InMemoryFocusSessionRepository(),
        reminders: new InMemoryReminderRepository(),
        elearning: new InMemoryElearningRepository(),
      })
      return { a: side(), b: side() }
    },
  },
]

let closeAfter: Array<() => Promise<void>> = []

beforeEach(() => {
  closeAfter = []
})

for (const flavor of FLAVORS) {
  describe(`IDOR — ${flavor.name}`, () => {
    it('không thấy task của user khác khi list', async () => {
      const { a, b } = await flavor.build()
      const taskB = await b.tasks.create({ title: 'Kế hoạch của B' })

      const listA = await a.tasks.list()
      expect(listA.map((t) => t.id)).not.toContain(taskB.id)
      expect(await a.tasks.findById(taskB.id)).toBeNull()
    })

    it('không sửa được task của user khác', async () => {
      const { a, b } = await flavor.build()
      const taskB = await b.tasks.create({ title: 'Kế hoạch của B' })

      // `update`/`setDone` ném lỗi khi không thấy dòng — dù ID có tồn tại thật.
      await expect(a.tasks.update(taskB.id, { title: 'Bị sửa' })).rejects.toThrow()
      await expect(a.tasks.setDone(taskB.id, true)).rejects.toThrow()

      // Và bản ghi của B phải còn nguyên.
      expect((await b.tasks.findById(taskB.id))?.title).toBe('Kế hoạch của B')
      expect((await b.tasks.findById(taskB.id))?.isDone).toBe(false)
    })

    it('không xoá được task của user khác', async () => {
      const { a, b } = await flavor.build()
      const taskB = await b.tasks.create({ title: 'Kế hoạch của B' })

      await expect(a.tasks.softDelete(taskB.id)).rejects.toThrow()
      expect(await b.tasks.findById(taskB.id)).not.toBeNull()
    })

    it('không thấy checklist của user khác, kể cả khi biết taskId', async () => {
      const { a, b } = await flavor.build()
      const taskB = await b.tasks.create({ title: 'Kế hoạch của B' })
      const itemB = await b.checklists.create(taskB.id, 'Mục của B')

      expect(await a.checklists.findById(itemB.id)).toBeNull()
      expect(await a.checklists.listByTask(taskB.id)).toEqual([])
      await expect(a.checklists.setDone(itemB.id, true)).rejects.toThrow()
      await expect(a.checklists.remove(itemB.id)).rejects.toThrow()

      // Task của B vẫn nguyên vẹn sau khi A thử thao tác trúng ID.
      expect((await b.checklists.findById(itemB.id))?.isDone).toBe(false)
    })

    it('không thấy folder/list của user khác', async () => {
      const { a, b } = await flavor.build()
      const folderB = await b.folderLists.createFolder('Folder của B')
      const listB = await b.folderLists.createList('List của B', folderB.id)

      expect(await a.folderLists.findFolder(folderB.id)).toBeNull()
      expect(await a.folderLists.findList(listB.id)).toBeNull()
      expect(await a.folderLists.tree()).toEqual([])
      expect(await a.folderLists.rootLists()).toEqual([])

      await expect(a.folderLists.renameFolder(folderB.id, 'Bị đổi')).rejects.toThrow()
      await expect(a.folderLists.renameList(listB.id, 'Bị đổi')).rejects.toThrow()

      // `remove*` cố ý là no-op im lặng khi không thấy dòng (xoá thứ đã không
      // còn thì không có gì để làm), nên không ném lỗi. Bảo đảm bảo mật không nằm
      // ở việc ném hay không mà ở việc dữ liệu của B phải còn nguyên.
      await expect(a.folderLists.removeFolder(folderB.id)).resolves.toBeUndefined()
      await expect(a.folderLists.removeList(listB.id)).resolves.toBeUndefined()

      expect(await b.folderLists.findFolder(folderB.id)).not.toBeNull()
      expect((await b.folderLists.findList(listB.id))?.name).toBe('List của B')
    })


    it('không thấy habit và log của user khác', async () => {
      const { a, b } = await flavor.build()
      const habitB = await b.habits.create({ name: 'Thói quen của B' })
      await b.habits.checkIn(habitB.id, new Date('2026-10-05T00:00:00.000Z'))

      expect(await a.habits.findById(habitB.id)).toBeNull()
      expect(await a.habits.listActive()).toEqual([])
      expect(await a.habits.logsFor(habitB.id)).toEqual([])

      // Ghi cũng phải bị chặn: nếu không, A sẽ tạo được log của mình trên habit
      // của B và đọc ngược lại thấy hoạt động của B.
      await expect(a.habits.checkIn(habitB.id, new Date('2026-10-05T00:00:00.000Z'))).rejects.toThrow()
      await expect(a.habits.archive(habitB.id)).rejects.toThrow()

      expect(await b.habits.logsFor(habitB.id)).toHaveLength(1)
      expect((await b.habits.findById(habitB.id))?.archived).toBe(false)
    })

    it('không thấy phiên tập trung của user khác', async () => {
      const { a, b } = await flavor.build()
      await b.focusSessions.record({
        mode: 'work',
        startedAt: new Date('2026-10-05T01:00:00.000Z'),
        endedAt: new Date('2026-10-05T01:25:00.000Z'),
        durationMin: 25,
        completed: true,
        taskId: null,
      })

      const from = new Date('2026-10-01T00:00:00.000Z')
      expect(await a.focusSessions.listSince(from)).toEqual([])
      expect(await a.focusSessions.totalCompletedWorkMinutes(from)).toBe(0)
    })

    it('không thấy reminder của user khác và không thao tác được', async () => {
      const { a, b } = await flavor.build()
      const due = new Date('2026-10-05T09:00:00.000Z')
      const remB = await b.reminders.create({ title: 'Nhắc của B', dueAt: due })

      expect(await a.reminders.findById(remB.id)).toBeNull()
      expect(await a.reminders.list()).toEqual([])

      await expect(a.reminders.markDone(remB.id)).rejects.toThrow()
      await expect(a.reminders.reschedule(remB.id, new Date('2026-10-06T09:00:00.000Z'))).rejects.toThrow()
      await expect(a.reminders.markNotified(remB.id, due)).rejects.toThrow()
      await expect(a.reminders.remove(remB.id)).rejects.toThrow()

      const after = await b.reminders.findById(remB.id)
      expect(after?.done).toBe(false)
      expect(after?.notifiedAt).toBeNull()
      expect(after?.dueAt.toISOString()).toBe('2026-10-05T09:00:00.000Z')
    })

    it('không thấy e-learning của user khác', async () => {
      const { a, b } = await flavor.build()
      await b.elearning.save([
        {
          course: 'Khoá của B',
          title: 'Bài của B',
          dueAt: '2026-10-10',
          url: null,
          type: 'task',
          source: 'csv',
          externalId: null,
        },
      ])

      expect(await a.elearning.list()).toEqual([])
      expect(await a.elearning.listByType('task')).toEqual([])
      expect(await a.elearning.count()).toBe(0)
      expect(await b.elearning.count()).toBe(1)
    })

        it('tên folder trùng ở hai user không đụng nhau', async () => {
      const { a, b } = await flavor.build()
      // Cùng tên ở user khác phải tạo được, vì ràng buộc trùng tên là theo user.
      await b.folderLists.createFolder('Việc')
      await expect(a.folderLists.createFolder('Việc')).resolves.toMatchObject({ name: 'Việc' })
    })
  })
}

afterEach(async () => {
  for (const close of closeAfter) await close()
})
