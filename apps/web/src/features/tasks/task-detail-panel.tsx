'use client'

import { useState } from 'react'

import type { ChecklistItem } from './checklist-types'
import type { Task } from './types'

type Props = {
  task: Task
  checklist: ChecklistItem[]
  subtasks: Task[]
  onAddChecklistItem: (taskId: string, title: string) => Promise<unknown>
  onToggleChecklistItem: (id: string, isDone: boolean) => Promise<unknown>
  onRemoveChecklistItem: (id: string) => Promise<unknown>
  onAddSubtask: (parentId: string, title: string) => Promise<unknown>
  onToggleSubtask: (id: string, isDone: boolean) => Promise<unknown>
}

export function TaskDetailPanel({
  task,
  checklist,
  subtasks,
  onAddChecklistItem,
  onToggleChecklistItem,
  onRemoveChecklistItem,
  onAddSubtask,
  onToggleSubtask,
}: Props) {
  const [itemTitle, setItemTitle] = useState('')
  const [subtaskTitle, setSubtaskTitle] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function run(action: () => Promise<unknown>, fallback: string) {
    setError(null)
    try {
      await action()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : fallback)
    }
  }

  async function handleAddItem(event: React.FormEvent) {
    event.preventDefault()
    const title = itemTitle.trim()
    if (title === '') return
    await run(() => onAddChecklistItem(task.id, title), 'Không thêm được mục')
    setItemTitle('')
  }

  async function handleAddSubtask(event: React.FormEvent) {
    event.preventDefault()
    const title = subtaskTitle.trim()
    if (title === '') return
    await run(() => onAddSubtask(task.id, title), 'Không thêm được subtask')
    setSubtaskTitle('')
  }

  const isSubtask = task.parentId !== null

  return (
    <section className="space-y-4 rounded border p-3" aria-label={`Chi tiết ${task.title}`}>
      <h2 className="text-sm font-semibold">{task.title}</h2>

      {error !== null && (
        <p role="alert" className="rounded border border-red-300 bg-red-50 px-2 py-1 text-sm text-red-700">
          {error}
        </p>
      )}

      <section aria-label="Checklist">
        <h3 className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Checklist</h3>
        {checklist.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có mục nào.</p>
        ) : (
          <ul className="space-y-1">
            {checklist.map((entry) => (
              <li key={entry.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={entry.isDone}
                  aria-label={`Toggle mục ${entry.title}`}
                  onChange={() =>
                    run(
                      () => onToggleChecklistItem(entry.id, !entry.isDone),
                      'Không cập nhật được mục',
                    )
                  }
                />
                <span className={entry.isDone ? 'line-through opacity-60' : ''}>{entry.title}</span>
                <button
                  type="button"
                  className="ml-auto text-xs text-red-600"
                  aria-label={`Xoá mục ${entry.title}`}
                  onClick={() => run(() => onRemoveChecklistItem(entry.id), 'Không xoá được mục')}
                >
                  Xoá
                </button>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleAddItem} className="mt-2 flex gap-1">
          <label className="sr-only" htmlFor={`new-item-${task.id}`}>
            Mục checklist mới
          </label>
          <input
            id={`new-item-${task.id}`}
            className="flex-1 rounded border px-2 py-1 text-sm"
            placeholder="Mục checklist mới"
            value={itemTitle}
            onChange={(e) => setItemTitle(e.target.value)}
          />
          <button type="submit" className="rounded border px-2 py-1 text-xs">
            Thêm mục
          </button>
        </form>
      </section>

      {!isSubtask && (
        <section aria-label="Subtask">
          <h3 className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Subtask</h3>
          {subtasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có subtask.</p>
          ) : (
            <ul className="space-y-1">
              {subtasks.map((sub) => (
                <li key={sub.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={sub.isDone}
                    aria-label={`Toggle subtask ${sub.title}`}
                    onChange={() => run(() => onToggleSubtask(sub.id, !sub.isDone), 'Không cập nhật được subtask')}
                  />
                  <span className={sub.isDone ? 'line-through opacity-60' : ''}>{sub.title}</span>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={handleAddSubtask} className="mt-2 flex gap-1">
            <label className="sr-only" htmlFor={`new-subtask-${task.id}`}>
              Tên subtask mới
            </label>
            <input
              id={`new-subtask-${task.id}`}
              className="flex-1 rounded border px-2 py-1 text-sm"
              placeholder="Subtask mới"
              value={subtaskTitle}
              onChange={(e) => setSubtaskTitle(e.target.value)}
            />
            <button type="submit" className="rounded border px-2 py-1 text-xs">
              Thêm subtask
            </button>
          </form>
        </section>
      )}
    </section>
  )
}