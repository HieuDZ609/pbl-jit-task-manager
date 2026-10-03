import { randomUUID } from 'node:crypto'
import type { Task } from '@/features/tasks/types'
import type {
  CreateTaskInput,
  ListTasksFilter,
  TaskRepository,
  UpdateTaskInput,
} from './task-repository'

export class InMemoryTaskRepository implements TaskRepository {
  private rows: Task[] = []

  async create(input: CreateTaskInput): Promise<Task> {
    const row: Task = {
      id: randomUUID(),
      title: input.title,
      content: input.content ?? null,
      eisenhowerQuadrant: input.eisenhowerQuadrant ?? null,
      dueAt: input.dueAt ?? null,
      startAt: input.startAt ?? null,
      remindAt: input.remindAt ?? null,
      isDone: false,
      doneAt: null,
      parentId: input.parentId ?? null,
      listId: input.listId ?? null,
      myDayAt: input.myDayAt ?? null,
      deletedAt: null,
    }
    this.rows.push(row)
    return row
  }

  async update(id: string, input: UpdateTaskInput): Promise<Task> {
    const row = this.requireRow(id)
    Object.assign(row, input)
    return row
  }

  async findById(id: string): Promise<Task | null> {
    const row = this.rows.find((r) => r.id === id)
    if (!row || row.deletedAt) return null
    return row
  }

  async list(filter: ListTasksFilter = {}): Promise<Task[]> {
    return this.rows.filter((r) => {
      if (r.deletedAt) return false
      if (filter.eisenhowerQuadrant && r.eisenhowerQuadrant !== filter.eisenhowerQuadrant) return false
      if (filter.listId && r.listId !== filter.listId) return false
      if (filter.isDone !== undefined && r.isDone !== filter.isDone) return false
      return true
    })
  }

  async listSubtasks(parentId: string): Promise<Task[]> {
    return this.rows.filter((r) => !r.deletedAt && r.parentId === parentId)
  }

  async softDelete(id: string): Promise<void> {
    const row = this.requireRow(id)
    row.deletedAt = new Date()
  }

  async setDone(id: string, isDone: boolean): Promise<Task> {
    const row = this.requireRow(id)
    row.isDone = isDone
    row.doneAt = isDone ? new Date() : null
    return row
  }

  async setMyDay(id: string, myDayAt: Date | null): Promise<Task> {
    const row = this.requireRow(id)
    row.myDayAt = myDayAt
    return row
  }

  private requireRow(id: string): Task {
    const row = this.rows.find((r) => r.id === id)
    if (!row) throw new Error(`Task not found: ${id}`)
    return row
  }
}
