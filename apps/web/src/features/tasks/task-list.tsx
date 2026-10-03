'use client'

import { useState, useTransition } from 'react'
import { AddTaskForm } from './add-task-form'
import type { Task } from './types'

type Props = {
  initialTasks: Task[]
  onCreate?: (title: string) => Promise<void>
  onToggle?: (id: string, isDone: boolean) => Promise<void>
  onDelete?: (id: string) => Promise<void>
}

export function TaskList({ initialTasks, onCreate, onToggle, onDelete }: Props) {
  const [tasks, setTasks] = useState(initialTasks)
  const [, startTransition] = useTransition()

  async function handleToggle(task: Task) {
    const next = !task.isDone
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, isDone: next } : t)))
    if (onToggle) {
      await onToggle(task.id, next)
    }
  }

  async function handleDelete(task: Task) {
    setTasks((prev) => prev.filter((t) => t.id !== task.id))
    if (onDelete) {
      await onDelete(task.id)
    }
  }

  async function handleCreate(title: string) {
    if (onCreate) {
      await onCreate(title)
      startTransition(() => {})
    }
  }

  if (tasks.length === 0) {
    return (
      <div className="space-y-4">
        <AddTaskForm onCreate={handleCreate} />
        <p className="text-sm text-muted-foreground">Chưa có công việc nào.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <AddTaskForm onCreate={handleCreate} />
      <ul className="space-y-2">
        {tasks.map((task) => (
          <li key={task.id} className="flex items-center gap-3 rounded border px-3 py-2">
            <input
              type="checkbox"
              checked={task.isDone}
              onChange={() => handleToggle(task)}
              aria-label={`Toggle ${task.title}`}
            />
            <span className={task.isDone ? 'line-through opacity-60' : ''}>{task.title}</span>
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
    </div>
  )
}
