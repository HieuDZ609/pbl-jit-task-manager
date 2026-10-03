import type { ReminderRepeat } from '@/features/reminders/reminder-logic'

export type Reminder = {
  id: string
  title: string
  dueAt: Date
  repeat: ReminderRepeat
  done: boolean
  notifiedAt: Date | null
}

export type CreateReminderInput = {
  title: string
  dueAt: Date
  repeat?: ReminderRepeat
}

export interface ReminderRepository {
  create(input: CreateReminderInput): Promise<Reminder>
  list(): Promise<Reminder[]>
  findById(id: string): Promise<Reminder | null>
  markDone(id: string): Promise<void>
  reschedule(id: string, dueAt: Date): Promise<void>
  remove(id: string): Promise<void>
  markNotified(id: string, at: Date): Promise<void>
}
