import type { ChecklistItem } from '@/features/tasks/checklist-types'

export type { ChecklistItem }

export interface ChecklistRepository {
  create(taskId: string, title: string): Promise<ChecklistItem>
  findById(id: string): Promise<ChecklistItem | null>
  listByTask(taskId: string): Promise<ChecklistItem[]>
  setDone(id: string, isDone: boolean): Promise<ChecklistItem>
  remove(id: string): Promise<void>
}
