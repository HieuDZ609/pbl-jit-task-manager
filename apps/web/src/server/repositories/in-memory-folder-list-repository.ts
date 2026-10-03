import { randomUUID } from 'node:crypto'
import type { Folder, FolderWithLists, List } from './folder-list-repository'

export class InMemoryFolderListRepository {
  private folders: Folder[] = []
  private lists: List[] = []

  async createFolder(name: string): Promise<Folder> {
    if (this.folders.some((f) => f.name === name)) {
      throw new Error(`Folder "${name}" đã tồn tại`)
    }
    const folder: Folder = { id: randomUUID(), name, color: null, sortOrder: this.folders.length }
    this.folders.push(folder)
    return folder
  }

  async createList(name: string, folderId?: string | null): Promise<List> {
    const parentId = folderId ?? null
    if (parentId !== null) {
      const isFolder = this.folders.some((f) => f.id === parentId)
      if (!isFolder) {
        throw new Error(`Folder ${parentId} không tồn tại — list chỉ được đặt trong folder`)
      }
    }
    if (this.lists.some((l) => l.folderId === parentId && l.name === name)) {
      throw new Error(`List "${name}" đã tồn tại trong phạm vi này`)
    }
    const list: List = {
      id: randomUUID(),
      folderId: parentId,
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

  async renameFolder(id: string, name: string): Promise<Folder> {
    const folder = this.folders.find((f) => f.id === id)
    if (!folder) throw new Error(`Folder ${id} không tồn tại`)
    if (this.folders.some((f) => f.id !== id && f.name === name)) {
      throw new Error(`Folder "${name}" đã tồn tại`)
    }
    folder.name = name
    return folder
  }

  async renameList(id: string, name: string): Promise<List> {
    const list = this.lists.find((l) => l.id === id)
    if (!list) throw new Error(`List ${id} không tồn tại`)
    if (this.lists.some((l) => l.id !== id && l.folderId === list.folderId && l.name === name)) {
      throw new Error(`List "${name}" đã tồn tại trong phạm vi này`)
    }
    list.name = name
    return list
  }

  async findFolder(id: string): Promise<Folder | null> {
    return this.folders.find((f) => f.id === id) ?? null
  }

  async findList(id: string): Promise<List | null> {
    return this.lists.find((l) => l.id === id) ?? null
  }
}