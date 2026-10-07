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

export type TaskFilter = { kind: 'all' } | { kind: 'folder'; id: string } | { kind: 'list'; id: string }
