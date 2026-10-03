import type { EisenhowerQuadrant, Task } from '@/features/tasks/types'

export type CreateTaskInput = {
  title: string
  content?: string | null
  eisenhowerQuadrant?: EisenhowerQuadrant | null
  dueAt?: Date | null
  startAt?: Date | null
  remindAt?: Date | null
  parentId?: string | null
  listId?: string | null
  myDayAt?: Date | null
}

export type UpdateTaskInput = Partial<CreateTaskInput>

export type ListTasksFilter = {
  eisenhowerQuadrant?: EisenhowerQuadrant
  listId?: string
  isDone?: boolean
}

export interface TaskRepository {
  create(input: CreateTaskInput): Promise<Task>
  update(id: string, input: UpdateTaskInput): Promise<Task>
  findById(id: string): Promise<Task | null>
  list(filter?: ListTasksFilter): Promise<Task[]>
  listSubtasks(parentId: string): Promise<Task[]>
  softDelete(id: string): Promise<void>
  setDone(id: string, isDone: boolean): Promise<Task>
  setMyDay(id: string, myDayAt: Date | null): Promise<Task>
}
