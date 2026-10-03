'use client'

import { useState } from 'react'

import { FolderListPanel, type TaskFilter } from './folder-list-panel'
import { TaskList } from './task-list'
import type { Task } from './types'
import type { FolderWithLists, List } from './folder-list-types'

type Props = {
  initialTasks: Task[]
  tree: FolderWithLists[]
  rootLists: List[]
  onCreate: (title: string) => Promise<Task | void>
  onToggle: (id: string, isDone: boolean) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onCreateFolder: (name: string) => Promise<unknown>
  onRenameFolder: (id: string, name: string) => Promise<unknown>
  onDeleteFolder: (id: string) => Promise<void>
  onCreateList: (name: string, folderId: string | null) => Promise<unknown>
  onRenameList: (id: string, name: string) => Promise<unknown>
  onDeleteList: (id: string) => Promise<void>
}

export function TasksWorkspace(props: Props) {
  const { initialTasks, tree, rootLists, onCreate, onToggle, onDelete } = props
  const [filter, setFilter] = useState<TaskFilter>({ kind: 'all' })

  const visible = initialTasks.filter((task) => {
    if (filter.kind === 'all') return true
    if (filter.kind === 'list') return task.listId === filter.id
    const folder = tree.find((f) => f.id === filter.id)
    return folder !== undefined && folder.lists.some((l) => l.id === task.listId)
  })

  return (
    <div className="grid gap-4 md:grid-cols-[240px_1fr]">
      <FolderListPanel
        tree={tree}
        rootLists={rootLists}
        activeFilter={filter}
        onFilterChange={setFilter}
        onCreateFolder={props.onCreateFolder}
        onRenameFolder={props.onRenameFolder}
        onDeleteFolder={props.onDeleteFolder}
        onCreateList={props.onCreateList}
        onRenameList={props.onRenameList}
        onDeleteList={props.onDeleteList}
      />
      <TaskList initialTasks={visible} onCreate={onCreate} onToggle={onToggle} onDelete={onDelete} />
    </div>
  )
}