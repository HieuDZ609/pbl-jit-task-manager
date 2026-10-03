'use server'

import { revalidatePath } from 'next/cache'
import { repos } from '@/server/repositories'
import { createReminderSchema } from '@pbl/validators'
import { nextOccurrence } from '@/features/reminders/reminder-logic'

export async function createReminder(input: unknown) {
  const data = createReminderSchema.parse(input)
  await repos.reminders.create({ title: data.title, dueAt: data.dueAt, repeat: data.repeat })
  revalidatePath('/reminders')
}

export async function completeReminder(reminderId: string) {
  const reminder = await repos.reminders.findById(reminderId)
  if (!reminder) throw new Error('Reminder not found')
  await repos.reminders.markDone(reminderId)
  const next = nextOccurrence(reminder, new Date())
  if (next) await repos.reminders.create({ title: reminder.title, dueAt: next, repeat: reminder.repeat })
  revalidatePath('/reminders')
}

export async function snoozeReminder(reminderId: string, minutes = 10) {
  const reminder = await repos.reminders.findById(reminderId)
  if (!reminder) throw new Error('Reminder not found')
  await repos.reminders.reschedule(reminderId, new Date(Date.now() + minutes * 60_000))
  revalidatePath('/reminders')
}

export async function deleteReminder(reminderId: string) {
  await repos.reminders.remove(reminderId)
  revalidatePath('/reminders')
}
