'use client'

import { useState } from 'react'

import type { FolderWithLists, List, TaskFilter } from './folder-list-types'

export type { TaskFilter }

type Props = {
  tree: FolderWithLists[]
  rootLists: List[]
  activeFilter: TaskFilter
  onFilterChange: (filter: TaskFilter) => void
  onCreateFolder: (name: string) => Promise<unknown>
  onRenameFolder: (id: string, name: string) => Promise<unknown>
  onDeleteFolder: (id: string) => Promise<void>
  onCreateList: (name: string, folderId: string | null) => Promise<unknown>
  onRenameList: (id: string, name: string) => Promise<unknown>
  onDeleteList: (id: string) => Promise<void>
}

export function FolderListPanel({
  tree,
  rootLists,
  activeFilter,
  onFilterChange,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onCreateList,
  onRenameList,
  onDeleteList,
}: Props) {
  const [folderName, setFolderName] = useState('')
  const [listName, setListName] = useState('')
  const [listFolderId, setListFolderId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showListForm, setShowListForm] = useState(false)
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null)
  const [renamingListId, setRenamingListId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  async function run(action: () => Promise<unknown>, fallback: string) {
    setError(null)
    try {
      await action()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : fallback)
    }
  }

  async function handleCreateFolder(event: React.FormEvent) {
    event.preventDefault()
    const name = folderName.trim()
    if (name === '') return
    await run(() => onCreateFolder(name), 'Không tạo được folder')
    setFolderName('')
  }

  async function handleCreateList(event: React.FormEvent) {
    event.preventDefault()
    const name = listName.trim()
    if (name === '') return
    await run(() => onCreateList(name, listFolderId === '' ? null : listFolderId), 'Không tạo được list')
    setListName('')
  }

  function openFolderRename(id: string, name: string) {
    setRenamingFolderId(id)
    setRenameValue(name)
  }

  function openListRename(id: string, name: string) {
    setRenamingListId(id)
    setRenameValue(name)
  }

  async function submitFolderRename(event: React.FormEvent, id: string) {
    event.preventDefault()
    const name = renameValue.trim()
    if (name === '') return
    await run(() => onRenameFolder(id, name), 'Không đổi được tên folder')
    setRenamingFolderId(null)
  }

  async function submitListRename(event: React.FormEvent, id: string) {
    event.preventDefault()
    const name = renameValue.trim()
    if (name === '') return
    await run(() => onRenameList(id, name), 'Không đổi được tên list')
    setRenamingListId(null)
  }

  const active = (kind: 'all'): boolean => activeFilter.kind === 'all'
  const activeId = (kind: 'folder' | 'list', id: string): boolean =>
    activeFilter.kind === kind && activeFilter.id === id

  return (
    <aside className="space-y-4 rounded border p-3" aria-label="Folder và list">
      {error !== null && (
        <p role="alert" className="rounded border border-red-300 bg-red-50 px-2 py-1 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="button"
        className="w-full rounded px-2 py-1 text-left text-sm font-medium hover:bg-muted"
        aria-current={active('all') ? 'true' : undefined}
        onClick={() => onFilterChange({ kind: 'all' })}
      >
        Tất cả
      </button>

      <section aria-label="Folder">
        <h2 className="mb-2 text-sm font-semibold">Folder</h2>
        <ul className="space-y-2">
          {tree.map((folder) => (
            <li key={folder.id} className="space-y-1">
              {renamingFolderId === folder.id ? (
                <form onSubmit={(e) => submitFolderRename(e, folder.id)} className="space-y-1">
                  <label className="sr-only text-xs" htmlFor={`rename-folder-${folder.id}`}>
                    Tên folder sau khi đổi
                  </label>
                  <input
                    id={`rename-folder-${folder.id}`}
                    className="w-full rounded border px-2 py-1 text-sm"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                  />
                  <div className="flex gap-1">
                    <button type="submit" className="rounded border px-2 py-0.5 text-xs">
                      Lưu tên folder
                    </button>
                    <button
                      type="button"
                      className="rounded border px-2 py-0.5 text-xs"
                      onClick={() => setRenamingFolderId(null)}
                    >
                      Huỷ đổi tên folder
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="flex-1 rounded px-2 py-1 text-left text-sm hover:bg-muted"
                    aria-current={activeId('folder', folder.id) ? 'true' : undefined}
                    onClick={() => onFilterChange({ kind: 'folder', id: folder.id })}
                  >
                    Lọc: {folder.name}
                  </button>
                  <button
                    type="button"
                    className="px-1 text-xs"
                    aria-label={`Đổi tên folder ${folder.name}`}
                    onClick={() => openFolderRename(folder.id, folder.name)}
                  >
                    Đổi tên
                  </button>
                  <button
                    type="button"
                    className="px-1 text-xs text-red-600"
                    aria-label={`Xoá folder ${folder.name}`}
                    onClick={() => run(() => onDeleteFolder(folder.id), 'Không xoá được folder')}
                  >
                    Xoá
                  </button>
                </div>
              )}
              <ul className="pl-4">
                {folder.lists.map((list) => (
                  <li key={list.id}>
                    {renamingListId === list.id ? (
                      <form onSubmit={(e) => submitListRename(e, list.id)} className="space-y-1">
                        <label className="sr-only text-xs" htmlFor={`rename-list-${list.id}`}>
                          Tên list sau khi đổi
                        </label>
                        <input
                          id={`rename-list-${list.id}`}
                          className="w-full rounded border px-2 py-1 text-xs"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                        />
                        <div className="flex gap-1">
                          <button type="submit" className="rounded border px-2 py-0.5 text-xs">
                            Lưu tên list
                          </button>
                          <button
                            type="button"
                            className="rounded border px-2 py-0.5 text-xs"
                            onClick={() => setRenamingListId(null)}
                          >
                            Huỷ đổi tên list
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          className="flex-1 rounded px-2 py-1 text-left text-xs hover:bg-muted"
                          aria-current={activeId('list', list.id) ? 'true' : undefined}
                          onClick={() => onFilterChange({ kind: 'list', id: list.id })}
                        >
                          Lọc: {list.name}
                        </button>
                        <button
                          type="button"
                          className="px-1 text-xs"
                          aria-label={`Đổi tên list ${list.name}`}
                          onClick={() => openListRename(list.id, list.name)}
                        >
                          Đổi tên
                        </button>
                        <button
                          type="button"
                          className="px-1 text-xs text-red-600"
                          aria-label={`Xoá list ${list.name}`}
                          onClick={() => run(() => onDeleteList(list.id), 'Không xoá được list')}
                        >
                          Xoá
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>

        <form onSubmit={handleCreateFolder} className="mt-2 space-y-1">
          <label className="block text-xs" htmlFor="new-folder-name">
            Tên folder mới
          </label>
          <input
            id="new-folder-name"
            className="w-full rounded border px-2 py-1 text-sm"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
          />
          <button type="submit" className="rounded border px-2 py-1 text-xs">
            Thêm folder
          </button>
        </form>
      </section>

      <section aria-label="List">
        <h2 className="mb-2 text-sm font-semibold">List</h2>
        <ul className="space-y-1">
          {rootLists.map((list) => (
            <li key={list.id} className="flex items-center gap-1">
              <button
                type="button"
                className="flex-1 rounded px-2 py-1 text-left text-sm hover:bg-muted"
                aria-current={activeId('list', list.id) ? 'true' : undefined}
                onClick={() => onFilterChange({ kind: 'list', id: list.id })}
              >
                Lọc: {list.name}
              </button>
              <button
                type="button"
                className="px-1 text-xs"
                aria-label={`Đổi tên list ${list.name}`}
                onClick={() => openListRename(list.id, list.name)}
              >
                Đổi tên
              </button>
              <button
                type="button"
                className="px-1 text-xs text-red-600"
                aria-label={`Xoá list ${list.name}`}
                onClick={() => run(() => onDeleteList(list.id), 'Không xoá được list')}
              >
                Xoá
              </button>
            </li>
          ))}
        </ul>

        <button
          type="button"
          className="mt-2 rounded border px-2 py-1 text-xs"
          onClick={() => setShowListForm((v) => !v)}
        >
          Thêm list
        </button>

        {showListForm && (
        <form onSubmit={handleCreateList} className="mt-2 space-y-1">
          <label className="block text-xs" htmlFor="new-list-folder">
            Folder của list
          </label>
          <select
            id="new-list-folder"
            className="w-full rounded border px-2 py-1 text-sm"
            value={listFolderId}
            onChange={(e) => setListFolderId(e.target.value)}
          >
            <option value="">— Không folder —</option>
            {tree.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.name}
              </option>
            ))}
          </select>
          <label className="block text-xs" htmlFor="new-list-name">
            Tên list mới
          </label>
          <input
            id="new-list-name"
            className="w-full rounded border px-2 py-1 text-sm"
            value={listName}
            onChange={(e) => setListName(e.target.value)}
          />
          <button type="submit" className="rounded border px-2 py-1 text-xs">
            Lưu list
          </button>
        </form>
        )}
      </section>
    </aside>
  )
}
