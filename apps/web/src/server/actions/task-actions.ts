'use server'

import { revalidatePath } from 'next/cache'
import { currentRepos } from '@/server/repositories'
import { selectSmartList } from '@/features/tasks/smart-lists'
import { TaskSchema } from '@pbl/validators'
import type { SmartListKey } from '@/features/tasks/types'

export async function createTask(title: string) {
  const data = TaskSchema.parse({ title })
  const repos = await currentRepos()
  const created = await repos.tasks.create({ title: data.title })
  revalidatePath('/tasks')
  return created
}

export async function setTaskDone(id: string, isDone: boolean) {
  const repos = await currentRepos()
  await repos.tasks.setDone(id, isDone)
  revalidatePath('/tasks')
  revalidatePath('/myday')
}

export async function deleteTask(id: string) {
  const repos = await currentRepos()
  await repos.tasks.softDelete(id)
  revalidatePath('/tasks')
}

export async function setTaskQuadrant(id: string, quadrant: 'A' | 'B' | 'C' | 'D') {
  const repos = await currentRepos()
  await repos.tasks.update(id, { eisenhowerQuadrant: quadrant })
  revalidatePath('/matrix')
  revalidatePath('/tasks')
}

export async function getTasks() {
  const repos = await currentRepos()
  return repos.tasks.list()
}

export async function getSmartList(key: SmartListKey) {
  const repos = await currentRepos()
  const tasks = await repos.tasks.list()
  return selectSmartList(tasks, key)
}

export async function blockTaskOnDay(taskId: string, startHour: number, durationMinutes: number) {
  const day = new Date()
  const start = new Date(day)
  start.setHours(startHour, 0, 0, 0)
  const end = new Date(start.getTime() + durationMinutes * 60_000)
  const repos = await currentRepos()
  await repos.tasks.update(taskId, { startAt: start, dueAt: end })
  revalidatePath('/calendar')
}
