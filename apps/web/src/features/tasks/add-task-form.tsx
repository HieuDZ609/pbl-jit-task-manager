'use client'

import { useState } from 'react'

export function AddTaskForm({ onCreate }: { onCreate: (title: string) => Promise<void> }) {
  const [title, setTitle] = useState('')
  const [pending, setPending] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed || pending) return
    setPending(true)
    try {
      await onCreate(trimmed)
      setTitle('')
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <label htmlFor="new-task-title" className="sr-only">
        Title
      </label>
      <input
        id="new-task-title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Viết công việc mới..."
        className="flex-1 rounded border px-2 py-1"
      />
      <button type="submit" disabled={pending}>
        Add
      </button>
    </form>
  )
}
