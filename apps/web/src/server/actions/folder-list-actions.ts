'use server'

import { revalidatePath } from 'next/cache'
import { CreateFolderSchema, CreateListSchema, IdSchema, RenameSchema } from '@pbl/validators'

import { currentRepos } from '@/server/repositories'
import type { Folder, FolderWithLists, List } from '@/server/repositories/folder-list-repository'

function revalidate() {
  revalidatePath('/tasks')
}

export async function getFolderTree(): Promise<FolderWithLists[]> {
  const repos = await currentRepos()
  return repos.folderLists.tree()
}

export async function getRootLists(): Promise<List[]> {
  const repos = await currentRepos()
  return repos.folderLists.rootLists()
}

export async function createFolder(name: string): Promise<Folder> {
  const { name: clean } = CreateFolderSchema.parse({ name })
  const repos = await currentRepos()
  const folder = await repos.folderLists.createFolder(clean)
  revalidate()
  return folder
}

export async function createList(name: string, folderId?: string | null): Promise<List> {
  const data = CreateListSchema.parse({ name, folderId })
  const repos = await currentRepos()
  const list = await repos.folderLists.createList(data.name, data.folderId ?? null)
  revalidate()
  return list
}

export async function renameFolder(id: string, name: string): Promise<Folder> {
  const data = RenameSchema.parse({ id, name })
  const repos = await currentRepos()
  const folder = await repos.folderLists.renameFolder(data.id, data.name)
  revalidate()
  return folder
}

export async function renameList(id: string, name: string): Promise<List> {
  const data = RenameSchema.parse({ id, name })
  const repos = await currentRepos()
  const list = await repos.folderLists.renameList(data.id, data.name)
  revalidate()
  return list
}

export async function deleteFolder(id: string): Promise<void> {
  const folderId = IdSchema.parse(id)
  const repos = await currentRepos()
  if ((await repos.folderLists.findFolder(folderId)) === null) {
    throw new Error(`Folder ${folderId} không tồn tại`)
  }
  await repos.folderLists.removeFolder(folderId)
  revalidate()
}

export async function deleteList(id: string): Promise<void> {
  const listId = IdSchema.parse(id)
  const repos = await currentRepos()
  if ((await repos.folderLists.findList(listId)) === null) {
    throw new Error(`List ${listId} không tồn tại`)
  }
  await repos.folderLists.removeList(listId)
  revalidate()
}
