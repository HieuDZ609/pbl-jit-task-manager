import { randomUUID } from 'node:crypto'
import type { Folder, FolderWithLists, List } from './folder-list-repository'

export class InMemoryFolderListRepository {
  private folders: Folder[] = []
  private lists: List[] = []

  async createFolder(name: string): Promise<Folder> {
    const folder: Folder = {
      id: randomUUID(),
      name,
      color: null,
      sortOrder: this.folders.length,
    }
    this.folders.push(folder)
    return folder
  }

  async createList(name: string, folderId?: string | null): Promise<List> {
    if (folderId) {
      const isFolder = this.folders.some((f) => f.id === folderId)
      if (!isFolder) {
        throw new Error(`Lists cannot nest inside a list (max 2 levels): ${folderId}`)
      }
    }
    const list: List = {
      id: randomUUID(),
      folderId: folderId ?? null,
      name,
      color: null,
      sortOrder: this.lists.length,
    }
    this.lists.push(list)
    return list
  }

  async tree(): Promise<FolderWithLists[]> {
    return this.folders.map((folder) => ({
      ...folder,
      lists: this.lists.filter((l) => l.folderId === folder.id),
    }))
  }

  async rootLists(): Promise<List[]> {
    return this.lists.filter((l) => l.folderId === null)
  }

  async removeFolder(id: string): Promise<void> {
    this.folders = this.folders.filter((f) => f.id !== id)
    this.lists = this.lists.filter((l) => l.folderId !== id)
  }

  async removeList(id: string): Promise<void> {
    this.lists = this.lists.filter((l) => l.id !== id)
  }
}
