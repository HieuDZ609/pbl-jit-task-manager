'use server'

import { revalidatePath } from 'next/cache'
import { repos } from '@/server/repositories'
import { selectSmartList } from '@/features/tasks/smart-lists'
import type { SmartListKey } from '@/features/tasks/types'

export async function createTask(title: string) {
  await repos.tasks.create({ title })
  revalidatePath('/tasks')
}

export async function setTaskDone(id: string, isDone: boolean) {
  await repos.tasks.setDone(id, isDone)
  revalidatePath('/tasks')
  revalidatePath('/myday')
}

export async function deleteTask(id: string) {
  await repos.tasks.softDelete(id)
  revalidatePath('/tasks')
}

export async function setTaskQuadrant(id: string, quadrant: 'A' | 'B' | 'C' | 'D') {
  await repos.tasks.update(id, { eisenhowerQuadrant: quadrant })
  revalidatePath('/matrix')
  revalidatePath('/tasks')
}

export async function addChecklistItem(taskId: string, title: string) {
  await repos.checklists.create(taskId, title)
  revalidatePath('/tasks')
}

export async function getTasks() {
  return repos.tasks.list()
}

export async function getSmartList(key: SmartListKey) {
  const tasks = await repos.tasks.list()
  return selectSmartList(tasks, key)
}
