'use server'

import { revalidatePath } from 'next/cache'
import { repos } from '@/server/repositories'

export async function logFocusSession(input: {
  mode: 'work' | 'break' | 'longBreak'
  minutes: number
  completed: boolean
  taskId?: string | null
}) {
  const endedAt = new Date()
  const startedAt = new Date(endedAt.getTime() - input.minutes * 60_000)
  await repos.focusSessions.record({
    mode: input.mode,
    startedAt,
    endedAt,
    durationMin: input.minutes,
    completed: input.completed,
    taskId: input.taskId ?? null,
  })
  revalidatePath('/focus')
  revalidatePath('/myday')
}
