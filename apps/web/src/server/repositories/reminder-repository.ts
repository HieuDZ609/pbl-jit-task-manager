import type { ReminderRepeat } from '@/features/reminders/reminder-logic'
import type { Reminder, CreateReminderInput } from '@/features/reminders/types'

export type { Reminder, CreateReminderInput }

export interface ReminderRepository {
  create(input: CreateReminderInput): Promise<Reminder>
  list(): Promise<Reminder[]>
  findById(id: string): Promise<Reminder | null>
  markDone(id: string): Promise<void>
  reschedule(id: string, dueAt: Date): Promise<void>
  remove(id: string): Promise<void>
  markNotified(id: string, at: Date): Promise<void>
}
