import { InMemoryTaskRepository } from './in-memory-task-repository'
import { InMemoryChecklistRepository } from './in-memory-checklist-repository'
import { InMemoryFolderListRepository } from './in-memory-folder-list-repository'
import { InMemoryFocusSessionRepository } from './in-memory-focus-session-repository'
import { InMemoryHabitRepository } from './in-memory-habit-repository'

// Ruling: môi trường chưa có Postgres instance, dùng in-memory làm adapter mặc định.
// Khi có DATABASE_URL, thay bằng Drizzle adapter (xem drizzle-*-repository.ts).
const globalForRepo = globalThis as unknown as {
  __pblRepos?: {
    tasks: InMemoryTaskRepository
    checklists: InMemoryChecklistRepository
    folderLists: InMemoryFolderListRepository
    focusSessions: InMemoryFocusSessionRepository
    habits: InMemoryHabitRepository
  }
}

export const repos = (globalForRepo.__pblRepos ??= {
  tasks: new InMemoryTaskRepository(),
  checklists: new InMemoryChecklistRepository(),
  folderLists: new InMemoryFolderListRepository(),
  focusSessions: new InMemoryFocusSessionRepository(),
  habits: new InMemoryHabitRepository(),
})
