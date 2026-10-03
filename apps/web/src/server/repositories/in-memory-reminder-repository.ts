import { randomUUID } from 'node:crypto'
import type {
  CreateReminderInput,
  Reminder,
  ReminderRepository,
} from './reminder-repository'

export class InMemoryReminderRepository implements ReminderRepository {
  private rows: Reminder[] = []

  async create(input: CreateReminderInput): Promise<Reminder> {
    const reminder: Reminder = {
      id: randomUUID(),
      title: input.title,
      dueAt: input.dueAt,
      repeat: input.repeat ?? 'none',
      done: false,
      notifiedAt: null,
    }
    this.rows.push(reminder)
    return reminder
  }

  async list(): Promise<Reminder[]> {
    return [...this.rows]
  }

  async findById(id: string): Promise<Reminder | null> {
    return this.rows.find((r) => r.id === id) ?? null
  }

  async markDone(id: string): Promise<void> {
    this.require(id).done = true
  }

  async reschedule(id: string, dueAt: Date): Promise<void> {
    const row = this.require(id)
    row.dueAt = dueAt
    row.notifiedAt = null
  }

  async remove(id: string): Promise<void> {
    this.require(id)
    this.rows = this.rows.filter((r) => r.id !== id)
  }

  async markNotified(id: string, at: Date): Promise<void> {
    this.require(id).notifiedAt = at
  }

  private require(id: string): Reminder {
    const row = this.rows.find((r) => r.id === id)
    if (!row) throw new Error(`Reminder not found: ${id}`)
    return row
  }
}
