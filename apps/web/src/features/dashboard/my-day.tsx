'use client'

import { useState, type FormEvent } from 'react'
import { toDateKey } from '@/features/habits/streak'
import type { Task } from '@/features/tasks/types'

type Props = {
  tasks: Task[]
  today: Date
  onQuickAdd: (title: string) => void | Promise<void>
  onToggle: (taskId: string) => void
}

export function MyDay({ tasks, today, onQuickAdd, onToggle }: Props) {
  const [title, setTitle] = useState('')
  const todayKey = toDateKey(today)

  const mine = tasks.filter((t) => t.myDayAt && toDateKey(t.myDayAt) === todayKey)
  const remaining = mine.filter((t) => !t.isDone).length

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    setTitle('')
    await onQuickAdd(trimmed)
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <label className="sr-only" htmlFor="myday-quick-add">
          Việc hôm nay
        </label>
        <input
          id="myday-quick-add"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Việc cần làm hôm nay"
          className="flex-1 rounded border px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded bg-slate-900 px-3 py-2 text-sm text-white">
          Thêm
        </button>
      </form>

      <p className="text-xs text-muted-foreground">
        Còn <span data-testid="myday-remaining">{remaining}</span> việc hôm nay
      </p>

      {mine.length === 0 ? (
        <p className="text-sm text-muted-foreground">Hôm nay chưa có việc gì. Thêm một việc ở trên.</p>
      ) : (
        <ul className="space-y-1">
          {mine.map((t) => (
            <li key={t.id} className="flex items-center gap-2 rounded border p-2 text-sm">
              <input
                type="checkbox"
                checked={t.isDone}
                onChange={() => onToggle(t.id)}
                aria-label={t.title}
              />
              <span className={t.isDone ? 'line-through opacity-60' : ''}>{t.title}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
