'use server'

import { revalidatePath } from 'next/cache'
import { repos } from '@/server/repositories'
import { logHabitSchema, createHabitSchema } from '@pbl/validators'

export async function createHabit(input: unknown) {
  const data = createHabitSchema.parse(input)
  await repos.habits.create(data)
  revalidatePath('/habits')
}

export async function checkInHabit(habitId: string) {
  logHabitSchema.parse({ habitId })
  await repos.habits.checkIn(habitId, new Date())
  revalidatePath('/habits')
}

export async function undoHabitCheckIn(habitId: string) {
  logHabitSchema.parse({ habitId })
  await repos.habits.setCount(habitId, new Date(), 0)
  revalidatePath('/habits')
}

export async function archiveHabit(habitId: string) {
  logHabitSchema.parse({ habitId })
  await repos.habits.archive(habitId)
  revalidatePath('/habits')
}
