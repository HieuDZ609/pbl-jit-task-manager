export type Folder = {
  id: string
  name: string
  color: string | null
  sortOrder: number
}

export type List = {
  id: string
  folderId: string | null
  name: string
  color: string | null
  sortOrder: number
}

export type FolderWithLists = Folder & { lists: List[] }

export interface FolderListRepository {
  createFolder(name: string): Promise<Folder>
  createList(name: string, folderId?: string | null): Promise<List>
  tree(): Promise<FolderWithLists[]>
  rootLists(): Promise<List[]>
  removeFolder(id: string): Promise<void>
  removeList(id: string): Promise<void>
}
