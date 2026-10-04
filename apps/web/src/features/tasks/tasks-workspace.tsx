'use client'

import { useEffect, useState } from 'react'

import { FolderListPanel } from './folder-list-panel'
import type { TaskFilter } from './folder-list-types'
import { TaskDetailPanel } from './task-detail-panel'
import { TaskList } from './task-list'
import type { Task } from './types'
import type { FolderWithLists, List } from './folder-list-types'
import type { ChecklistItem } from './checklist-types'

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
  listChecklistItems: (taskId: string) => Promise<ChecklistItem[]>
  addChecklistItem: (taskId: string, title: string) => Promise<unknown>
  setChecklistItemDone: (id: string, isDone: boolean) => Promise<unknown>
  removeChecklistItem: (id: string) => Promise<unknown>
  addSubtask: (parentId: string, title: string) => Promise<unknown>
  setTaskDone: (id: string, isDone: boolean) => Promise<void>
}

export function TasksWorkspace(props: Props) {
  const { initialTasks, tree, rootLists, onCreate, onToggle, onDelete } = props
  const [filter, setFilter] = useState<TaskFilter>({ kind: 'all' })
  const [openTaskId, setOpenTaskId] = useState<string | null>(null)
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])

  const visible = initialTasks.filter((task) => {
    if (filter.kind === 'all') return true
    if (filter.kind === 'list') return task.listId === filter.id
    const folder = tree.find((f) => f.id === filter.id)
    return folder !== undefined && folder.lists.some((l) => l.id === task.listId)
  })

  const openTask = initialTasks.find((t) => t.id === openTaskId) ?? null
  const subtasks = openTask === null ? [] : initialTasks.filter((t) => t.parentId === openTask.id)

  useEffect(() => {
    if (openTaskId === null) {
      setChecklist([])
      return
    }
    let cancelled = false
    void props
      .listChecklistItems(openTaskId)
      .then((items) => {
        if (!cancelled) setChecklist(items)
      })
      .catch(() => {
        if (!cancelled) setChecklist([])
      })
    return () => {
      cancelled = true
    }
  }, [openTaskId, props.listChecklistItems])

  async function handleAddChecklistItem(taskId: string, title: string) {
    const created = (await props.addChecklistItem(taskId, title)) as ChecklistItem | void
    if (created) setChecklist((prev) => [...prev, created])
  }

  async function handleRemoveChecklistItem(id: string) {
    await props.removeChecklistItem(id)
    setChecklist((prev) => prev.filter((i) => i.id !== id))
  }

  async function handleAddSubtask(parentId: string, title: string) {
    await props.addSubtask(parentId, title)
  }

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
      <div className="space-y-4">
        <TaskList
          initialTasks={visible}
          onCreate={onCreate}
          onToggle={onToggle}
          onDelete={onDelete}
          onOpen={setOpenTaskId}
        />
        {openTask !== null && (
          <div className="relative">
            <button
              type="button"
              className="absolute right-2 top-2 text-xs text-muted-foreground"
              onClick={() => setOpenTaskId(null)}
            >
              Đóng chi tiết
            </button>
            <TaskDetailPanel
              task={openTask}
              checklist={checklist}
              subtasks={subtasks}
              onAddChecklistItem={handleAddChecklistItem}
              onToggleChecklistItem={async (id, isDone) => {
                await props.setChecklistItemDone(id, isDone)
                setChecklist((prev) => prev.map((i) => (i.id === id ? { ...i, isDone } : i)))
              }}
              onRemoveChecklistItem={handleRemoveChecklistItem}
              onAddSubtask={handleAddSubtask}
              onToggleSubtask={props.setTaskDone}
            />
          </div>
        )}
      </div>
    </div>
  )
}