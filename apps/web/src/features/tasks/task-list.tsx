'use client'

import { useEffect, useState, useTransition } from 'react'
import { AddTaskForm } from './add-task-form'
import type { Task } from './types'

type Props = {
  initialTasks: Task[]
  onCreate?: (title: string) => Promise<Task | void>
  onToggle?: (id: string, isDone: boolean) => Promise<void>
  onDelete?: (id: string) => Promise<void>
  onOpen?: (id: string) => void
}

export function TaskList({ initialTasks, onCreate, onToggle, onDelete, onOpen }: Props) {
  const [tasks, setTasks] = useState(initialTasks)
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  // revalidatePath làm `initialTasks` đổi identity; đồng bộ để không bị state cũ.
  useEffect(() => {
    setTasks(initialTasks)
  }, [initialTasks])

  async function handleToggle(task: Task) {
    const next = !task.isDone
    setError(null)
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, isDone: next } : t)))
    try {
      await onToggle?.(task.id, next)
    } catch {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, isDone: task.isDone } : t)))
      setError('Không cập nhật được công việc. Vui lòng thử lại.')
    }
  }

  async function handleDelete(task: Task) {
    setError(null)
    setTasks((prev) => prev.filter((t) => t.id !== task.id))
    try {
      await onDelete?.(task.id)
    } catch {
      setTasks((prev) => [...prev, task])
      setError('Không xoá được công việc. Vui lòng thử lại.')
    }
  }

  async function handleCreate(title: string) {
    setError(null)
    try {
      const created = await onCreate?.(title)
      if (created) {
        setTasks((prev) => [...prev, created])
      }
      startTransition(() => {})
    } catch {
      setError('Không tạo được công việc. Vui lòng thử lại.')
    }
  }

  return (
    <div className="space-y-4">
      {error !== null && (
        <p role="alert" className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <AddTaskForm onCreate={handleCreate} />
      {tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground">Chưa có công việc nào.</p>
      ) : (
        <ul className="space-y-2">
          {tasks.map((task) => (
            <li key={task.id} className="flex items-center gap-3 rounded border px-3 py-2">
              <input
                type="checkbox"
                checked={task.isDone}
                onChange={() => handleToggle(task)}
                aria-label={`Toggle ${task.title}`}
              />
              {onOpen ? (
                <button
                  type="button"
                  className="text-left font-medium hover:underline"
                  aria-label={`Mở chi tiết ${task.title}`}
                  onClick={() => onOpen(task.id)}
                >
                  <span className={task.isDone ? 'line-through opacity-60' : ''}>{task.title}</span>
                </button>
              ) : (
                <span className={task.isDone ? 'line-through opacity-60' : ''}>{task.title}</span>
              )}
              {task.eisenhowerQuadrant && (
                <span className="rounded bg-muted px-2 py-0.5 text-xs font-semibold">
                  {task.eisenhowerQuadrant}
                </span>
              )}
              <button
                type="button"
                className="ml-auto text-sm text-red-600"
                onClick={() => handleDelete(task)}
                aria-label={`Delete ${task.title}`}
              >
                Xóa
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}