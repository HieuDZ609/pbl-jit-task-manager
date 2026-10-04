'use server'

import { revalidatePath } from 'next/cache'
import { CreateSubtaskSchema, IdSchema } from '@pbl/validators'

import { currentRepos } from '@/server/repositories'
import type { Task } from '@/features/tasks/types'

function revalidate() {
  revalidatePath('/tasks')
}

export async function addSubtask(parentId: string, title: string): Promise<Task> {
  const data = CreateSubtaskSchema.parse({ parentId, title })
  const repos = await currentRepos()
  const parent = await repos.tasks.findById(data.parentId)
  if (parent === null) {
    throw new Error(`Task ${data.parentId} không tồn tại`)
  }
  if (parent.parentId !== null) {
    throw new Error('Subtask chỉ được nest tối đa 2 cấp')
  }
  const child = await repos.tasks.create({
    title: data.title,
    parentId: parent.id,
    listId: parent.listId ?? null,
  })
  revalidate()
  return child
}

export async function listSubtasks(parentId: string): Promise<Task[]> {
  const id = IdSchema.parse(parentId)
  const repos = await currentRepos()
  return repos.tasks.listSubtasks(id)
}
