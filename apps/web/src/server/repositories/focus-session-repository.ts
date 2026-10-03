export type FocusSession = {
  id: string
  mode: 'work' | 'break' | 'longBreak'
  startedAt: Date
  endedAt: Date
  durationMin: number
  completed: boolean
  taskId: string | null
}

export type RecordFocusSessionInput = Omit<FocusSession, 'id'>

export interface FocusSessionRepository {
  record(input: RecordFocusSessionInput): Promise<FocusSession>
  listSince(from: Date): Promise<FocusSession[]>
  totalCompletedWorkMinutes(from: Date): Promise<number>
}
