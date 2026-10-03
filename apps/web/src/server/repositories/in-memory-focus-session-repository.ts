import { randomUUID } from 'node:crypto'
import type {
  FocusSession,
  FocusSessionRepository,
  RecordFocusSessionInput,
} from './focus-session-repository'

export class InMemoryFocusSessionRepository implements FocusSessionRepository {
  private rows: FocusSession[] = []

  async record(input: RecordFocusSessionInput): Promise<FocusSession> {
    const session: FocusSession = { id: randomUUID(), ...input }
    this.rows.push(session)
    return session
  }

  async listSince(from: Date): Promise<FocusSession[]> {
    return this.rows.filter((r) => r.startedAt.getTime() >= from.getTime())
  }

  async totalCompletedWorkMinutes(from: Date): Promise<number> {
    const rows = await this.listSince(from)
    return rows
      .filter((r) => r.mode === 'work' && r.completed)
      .reduce((sum, r) => sum + r.durationMin, 0)
  }
}
