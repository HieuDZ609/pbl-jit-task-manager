'use client'

import { useState, type FormEvent } from 'react'
import type { ReminderRepeat } from './reminder-logic'

type Props = {
  onCreate: (input: { title: string; dueAt: Date; repeat: ReminderRepeat }) => void | Promise<void>
}

function toLocalInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function ReminderForm({ onCreate }: Props) {
  const [title, setTitle] = useState('')
  const [dueAt, setDueAt] = useState(() => toLocalInputValue(new Date()))
  const [repeat, setRepeat] = useState<ReminderRepeat>('none')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) {
      setError('Tiêu đề nhắc nhở là bắt buộc')
      return
    }
    const parsed = new Date(dueAt)
    if (Number.isNaN(parsed.getTime())) {
      setError('Thời gian không hợp lệ')
      return
    }
    setError(null)
    setTitle('')
    await onCreate({ title: trimmed, dueAt: parsed, repeat })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-start gap-2">
      <div className="flex-1">
        <label className="sr-only" htmlFor="reminder-title">
          Tiêu đề
        </label>
        <input
          id="reminder-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Gọi mẹ lúc 10h"
          className="w-full rounded border px-3 py-2 text-sm"
        />
      </div>
      <label className="sr-only" htmlFor="reminder-due">
        Thời gian
      </label>
      <input
        id="reminder-due"
        type="datetime-local"
        value={dueAt}
        onChange={(e) => setDueAt(e.target.value)}
        className="rounded border px-2 py-2 text-sm"
      />
      <label className="sr-only" htmlFor="reminder-repeat">
        Lặp lại
      </label>
      <select
        id="reminder-repeat"
        value={repeat}
        onChange={(e) => setRepeat(e.target.value as ReminderRepeat)}
        className="rounded border px-2 py-2 text-sm"
      >
        <option value="none">Không lặp</option>
        <option value="daily">Hằng ngày</option>
        <option value="weekly">Hằng tuần</option>
      </select>
      <button type="submit" className="rounded bg-slate-900 px-3 py-2 text-sm text-white">
        Thêm nhắc nhở
      </button>
      {error ? (
        <p role="alert" className="w-full text-xs text-red-600">
          {error}
        </p>
      ) : null}
    </form>
  )
}
