'use client'

import { useState, type FormEvent } from 'react'

type Props = {
  onCreate: (name: string) => void | Promise<void>
}

export function HabitForm({ onCreate }: Props) {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Tên thói quen là bắt buộc')
      return
    }
    setError(null)
    setName('')
    await onCreate(trimmed)
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-start gap-2">
      <div className="flex-1">
        <label className="sr-only" htmlFor="habit-name">
          Tên thói quen
        </label>
        <input
          id="habit-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Uống nước 2L"
          className="w-full rounded border px-3 py-2 text-sm"
        />
        {error ? (
          <p role="alert" className="mt-1 text-xs text-red-600">
            {error}
          </p>
        ) : null}
      </div>
      <button type="submit" className="rounded bg-slate-900 px-3 py-2 text-sm text-white">
        Thêm
      </button>
    </form>
  )
}
