import { InMemoryChecklistRepository } from '../in-memory-checklist-repository'
import { InMemoryElearningRepository } from '../in-memory-elearning-repository'
import { InMemoryFocusSessionRepository } from '../in-memory-focus-session-repository'
import { InMemoryFolderListRepository } from '../in-memory-folder-list-repository'
import { InMemoryHabitRepository } from '../in-memory-habit-repository'
import { InMemoryReminderRepository } from '../in-memory-reminder-repository'
import { InMemoryTaskRepository } from '../in-memory-task-repository'

const CACHE_KEY = '__pblTestRepos'

/**
 * Bundle in-memory cho unit test của server actions.
 *
 * Các test này kiểm tra *logic action* (validate, trim, chặn trùng, throw đúng
 * chỗ), không kiểm tra truy vấn SQL. Nếu để chúng chạy qua `currentRepos()`
 * thật thì chúng đụng DB, dữ liệu test lẫn vào dữ liệu dev, và mỗi test lại
 * phụ thuộc thứ tự vì DB không "trống" được. Phần DB thật đã được
 * `contract.test.ts` và integration test của Task 8 phủ.
 *
 * Xem `mockInMemoryRepos()` bên dưới.
 */
export function createInMemoryBundle() {
  return {
    tasks: new InMemoryTaskRepository(),
    checklists: new InMemoryChecklistRepository(),
    folderLists: new InMemoryFolderListRepository(),
    focusSessions: new InMemoryFocusSessionRepository(),
    habits: new InMemoryHabitRepository(),
    reminders: new InMemoryReminderRepository(),
    elearning: new InMemoryElearningRepository(),
  }
}

/**
 * Nội dung cho `vi.mock('@/server/repositories', ...)` — trả về một factory để
 * tránh lặp code ở mọi test file.
 *
 * Cache đặt trên `globalThis` vì `vi.resetModules()` KHÔNG chạy lại factory của
 * `vi.mock` — nếu cache nằm trong closure của factory thì mọi test trong file
 * dùng chung một store và dữ liệu rò giữa các test. Test gọi
 * `resetInMemoryRepos()` ở điểm bắt đầu mỗi case để store trống lại.
 *
 * Vẫn phải cache chứ không tạo bundle mới mỗi lần gọi: `currentRepos()` thật
 * cũng cache theo user, nếu mỗi lần trả bundle mới thì action ghi xong đọc
 * lại sẽ không thấy dữ liệu vừa ghi.
 */
export function mockInMemoryRepos() {
  return async () => {
    const { createInMemoryBundle } = await import(
      '@/server/repositories/__tests__/in-memory-bundle'
    )
    const g = globalThis as Record<string, unknown>
    return {
      currentRepos: async () =>
        (g[CACHE_KEY] as ReturnType<typeof createInMemoryBundle> | undefined) ??=
          createInMemoryBundle(),
    }
  }
}

/** Xoá store đã cache — gọi ở đầu mỗi test case. */
export function resetInMemoryRepos() {
  delete (globalThis as Record<string, unknown>)[CACHE_KEY]
}
