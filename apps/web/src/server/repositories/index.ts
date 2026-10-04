import { getDb } from '@pbl/db/client'

import type { ChecklistRepository } from './checklist-repository'
import type { FolderListRepository } from './folder-list-repository'
import type { ElearningRepository } from './elearning-repository'
import type { FocusSessionRepository } from './focus-session-repository'
import type { HabitRepository } from './habit-repository'
import type { ReminderRepository } from './reminder-repository'
import type { TaskRepository } from './task-repository'
import { currentUserId } from '@/server/current-user'

import { DrizzleChecklistRepository } from './drizzle-checklist-repository'
import { DrizzleFolderListRepository } from './drizzle-folder-list-repository'
import { DrizzleTaskRepository } from './drizzle-task-repository'
import { InMemoryElearningRepository } from './in-memory-elearning-repository'
import { InMemoryFocusSessionRepository } from './in-memory-focus-session-repository'
import { InMemoryHabitRepository } from './in-memory-habit-repository'
import { InMemoryReminderRepository } from './in-memory-reminder-repository'

export type Repos = {
  tasks: TaskRepository
  checklists: ChecklistRepository
  folderLists: FolderListRepository
  focusSessions: FocusSessionRepository
  habits: HabitRepository
  reminders: ReminderRepository
  elearning: ElearningRepository
}

const globalForRepos = globalThis as unknown as { __pblReposByUser?: Map<string, Repos> }
const byUser = (globalForRepos.__pblReposByUser ??= new Map<string, Repos>())

/**
 * Bundle repository scope theo một user.
 *
 * `userId` truyền vào constructor của adapter chứ không nằm ở method signature:
 * đó là cách khiến việc quên scope là không thể — không có cách nào gọi được repo
 * mà không nêu user. Adapter Drizzle tự thêm `user_id` vào mọi truy vấn.
 *
 * Bundle được cache theo user: adapter Drizzle là wrapper mỏng nên không cần
 * cache, nhưng các repo in-memory (Task 11 chuyển nốt) phải là **instance riêng
 * cho từng user** — nếu dùng chung một instance thì dữ liệu của user A lọt sang
 * user B, đúng thứ Task 10 sinh ra để chặn.
 */
export function reposFor(userId: string): Repos {
  const cached = byUser.get(userId)
  if (cached) return cached

  const db = getDb()
  const repos: Repos = {
    tasks: new DrizzleTaskRepository(db, userId),
    checklists: new DrizzleChecklistRepository(db, userId),
    folderLists: new DrizzleFolderListRepository(db, userId),
    focusSessions: new InMemoryFocusSessionRepository(),
    habits: new InMemoryHabitRepository(),
    reminders: new InMemoryReminderRepository(),
    elearning: new InMemoryElearningRepository(),
  }

  byUser.set(userId, repos)
  return repos
}

/**
 * Bundle repository của request hiện tại.
 *
 * Đây là hàm các call site dùng. `currentUserId()` là seam duy nhất cần sửa khi
 * Task 13 đưa đăng nhập thật vào — không phải sửa 15 call site.
 */
export async function currentRepos(): Promise<Repos> {
  return reposFor(await currentUserId())
}
