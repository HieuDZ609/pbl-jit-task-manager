import type { Folder, FolderWithLists, List } from '@/features/tasks/folder-list-types'

export type { Folder, FolderWithLists, List }

export interface FolderListRepository {
  createFolder(name: string): Promise<Folder>
  createList(name: string, folderId?: string | null): Promise<List>
  tree(): Promise<FolderWithLists[]>
  rootLists(): Promise<List[]>
  removeFolder(id: string): Promise<void>
  removeList(id: string): Promise<void>
  renameFolder(id: string, name: string): Promise<Folder>
  renameList(id: string, name: string): Promise<List>
  findFolder(id: string): Promise<Folder | null>
  findList(id: string): Promise<List | null>
}
