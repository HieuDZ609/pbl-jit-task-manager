'use server'

import { revalidatePath } from 'next/cache'
import { repos } from '@/server/repositories'
import { TaskSchema } from '@pbl/validators'

export async function quickAddToMyDay(title: string) {
  const data = TaskSchema.parse({ title })
  return repos.tasks.create({ title: data.title, myDayAt: new Date() })
}

export async function toggleMyDayTask(taskId: string) {
  const task = await repos.tasks.findById(taskId)
  if (!task) throw new Error('Task not found')
  await repos.tasks.setDone(taskId, !task.isDone)
  revalidatePath('/myday')
  revalidatePath('/dashboard')
}
