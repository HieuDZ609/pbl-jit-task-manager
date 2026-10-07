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
import { DrizzleElearningRepository } from './drizzle-elearning-repository'
import { DrizzleFocusSessionRepository } from './drizzle-focus-session-repository'
import { DrizzleFolderListRepository } from './drizzle-folder-list-repository'
import { DrizzleHabitRepository } from './drizzle-habit-repository'
import { DrizzleReminderRepository } from './drizzle-reminder-repository'
import { DrizzleTaskRepository } from './drizzle-task-repository'

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
 * Từ Task 11 **cả 7 repository đã là Drizzle** — không còn repo in-memory nào
 * trong bundle. Cache theo user vẫn giữ lại: nó rẻ và giữ được hợp đồng "cùng
 * một user trong một request luôn thấy cùng một bundle".
 */
export function reposFor(userId: string): Repos {
  const cached = byUser.get(userId)
  if (cached) return cached

  const db = getDb()
  const repos: Repos = {
    tasks: new DrizzleTaskRepository(db, userId),
    checklists: new DrizzleChecklistRepository(db, userId),
    folderLists: new DrizzleFolderListRepository(db, userId),
    habits: new DrizzleHabitRepository(db, userId),
    focusSessions: new DrizzleFocusSessionRepository(db, userId),
    reminders: new DrizzleReminderRepository(db, userId),
    elearning: new DrizzleElearningRepository(db, userId),
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
