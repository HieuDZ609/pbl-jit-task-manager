import type { ReminderRepeat } from './reminder-logic'

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