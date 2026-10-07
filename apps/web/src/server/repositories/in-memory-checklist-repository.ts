import { randomUUID } from 'node:crypto'
import type { ChecklistItem } from './checklist-repository'

export class InMemoryChecklistRepository {
  private rows: ChecklistItem[] = []

  async create(taskId: string, title: string): Promise<ChecklistItem> {
    const item: ChecklistItem = {
      id: randomUUID(),
      taskId,
      title,
      isDone: false,
      sortOrder: this.rows.length,
    }
    this.rows.push(item)
    return item
  }

  async findById(id: string): Promise<ChecklistItem | null> {
    return this.rows.find((r) => r.id === id) ?? null
  }

  async listByTask(taskId: string): Promise<ChecklistItem[]> {
    return this.rows.filter((r) => r.taskId === taskId)
  }

  async setDone(id: string, isDone: boolean): Promise<ChecklistItem> {
    const row = this.rows.find((r) => r.id === id)
    if (!row) throw new Error(`Checklist item not found: ${id}`)
    row.isDone = isDone
    return row
  }

  async remove(id: string): Promise<void> {
    const idx = this.rows.findIndex((r) => r.id === id)
    if (idx === -1) throw new Error(`Checklist item not found: ${id}`)
    this.rows.splice(idx, 1)
  }
}
