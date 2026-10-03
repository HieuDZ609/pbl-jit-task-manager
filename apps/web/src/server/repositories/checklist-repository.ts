export type ChecklistItem = {
  id: string
  taskId: string
  title: string
  isDone: boolean
  sortOrder: number
}

export interface ChecklistRepository {
  create(taskId: string, title: string): Promise<ChecklistItem>
  listByTask(taskId: string): Promise<ChecklistItem[]>
  setDone(id: string, isDone: boolean): Promise<ChecklistItem>
  remove(id: string): Promise<void>
}
