'use server'

import { revalidatePath } from 'next/cache'
import { currentRepos } from '@/server/repositories'
import { TaskSchema } from '@pbl/validators'

export async function quickAddToMyDay(title: string) {
  const data = TaskSchema.parse({ title })
  const repos = await currentRepos()
  return repos.tasks.create({ title: data.title, myDayAt: new Date() })
}

/**
 * Đánh dấu hoàn thành một việc đang nằm trong My Day.
 * Tên cũ `toggleMyDayTask` gợi ý ghim/ghim bỏ khỏi My Day, nhưng thực tế chỉ
 * đảo trạng thái hoàn thành (việc đã nằm trong My Day rồi nên không cần ghim).
 */
export async function toggleMyDayTaskDone(taskId: string) {
  const repos = await currentRepos()
  const task = await repos.tasks.findById(taskId)
  if (!task) throw new Error('Task not found')
  await repos.tasks.setDone(taskId, !task.isDone)
  revalidatePath('/myday')
  revalidatePath('/dashboard')
}
