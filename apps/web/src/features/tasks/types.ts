export type EisenhowerQuadrant = 'A' | 'B' | 'C' | 'D'

export type Task = {
  id: string
  title: string
  content?: string | null
  eisenhowerQuadrant?: EisenhowerQuadrant | null
  dueAt?: Date | null
  startAt?: Date | null
  remindAt?: Date | null
  isDone: boolean
  doneAt?: Date | null
  parentId?: string | null
  listId?: string | null
  myDayAt?: Date | null
  deletedAt?: Date | null
}

export type SmartListKey =
  | 'today'
  | 'tomorrow'
  | 'overdue'
  | 'upcoming'
  | 'all'
  | 'completed'
