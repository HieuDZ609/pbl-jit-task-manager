import type { FocusSession, RecordFocusSessionInput } from '@/features/focus/types'

export type { FocusSession, RecordFocusSessionInput }

export interface FocusSessionRepository {
  record(input: RecordFocusSessionInput): Promise<FocusSession>
  listSince(from: Date): Promise<FocusSession[]>
  totalCompletedWorkMinutes(from: Date): Promise<number>
}
