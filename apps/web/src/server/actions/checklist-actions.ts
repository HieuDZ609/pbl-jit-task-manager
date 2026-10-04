'use server'

import { revalidatePath } from 'next/cache'
import {
  CreateChecklistItemSchema,
  IdSchema,
  SetChecklistItemDoneSchema,
} from '@pbl/validators'

import { repos } from '@/server/repositories'
import type { ChecklistItem } from '@/server/repositories/checklist-repository'

function revalidate() {
  revalidatePath('/tasks')
}

async function requireItem(id: string): Promise<ChecklistItem> {
  const itemId = IdSchema.parse(id)
  const item = await repos.checklists.findById(itemId)
  if (item === null) {
    throw new Error(`Checklist item ${itemId} không tồn tại`)
  }
  return item
}

export async function addChecklistItem(taskId: string, title: string): Promise<ChecklistItem> {
  const data = CreateChecklistItemSchema.parse({ taskId, title })
  if ((await repos.tasks.findById(data.taskId)) === null) {
    throw new Error(`Task ${data.taskId} không tồn tại`)
  }
  const item = await repos.checklists.create(data.taskId, data.title)
  revalidate()
  return item
}

export async function listChecklistItems(taskId: string): Promise<ChecklistItem[]> {
  const id = IdSchema.parse(taskId)
  return repos.checklists.listByTask(id)
}

export async function setChecklistItemDone(id: string, isDone: boolean): Promise<ChecklistItem> {
  const data = SetChecklistItemDoneSchema.parse({ id, isDone })
  const existing = await requireItem(data.id)
  const item = await repos.checklists.setDone(existing.id, data.isDone)
  revalidate()
  return item
}

export async function removeChecklistItem(id: string): Promise<void> {
  const item = await requireItem(id)
  await repos.checklists.remove(item.id)
  revalidate()
}
