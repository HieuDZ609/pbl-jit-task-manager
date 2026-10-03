'use client'

import { useRef, useState } from 'react'
import { QUADRANTS, groupByQuadrant, moveTaskToQuadrant, quadrantMeta } from './quadrants'
import type { EisenhowerQuadrant, Task } from '@/features/tasks/types'

type Props = {
  initialTasks: Task[]
  onMove?: (taskId: string, target: EisenhowerQuadrant) => Promise<void> | void
}

export function MatrixGrid({ initialTasks, onMove }: Props) {
  const [tasks, setTasks] = useState(initialTasks)
  const [dragOver, setDragOver] = useState<EisenhowerQuadrant | null>(null)
  const draggingId = useRef<string | null>(null)

  const grouped = groupByQuadrant(tasks)

  async function handleDrop(target: EisenhowerQuadrant) {
    const id = draggingId.current
    setDragOver(null)
    draggingId.current = null
    if (!id) return
    const task = tasks.find((t) => t.id === id)
    if (!task || task.eisenhowerQuadrant === target) return
    setTasks((prev) => moveTaskToQuadrant(prev, id, target))
    if (onMove) await onMove(id, target)
  }

  return (
    <div className="space-y-3">
      {tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Chưa có việc nào. Thêm việc ở trang Tasks rồi kéo vào ma trận.
        </p>
      ) : null}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {QUADRANTS.map((q) => {
        const meta = quadrantMeta(q)
        const isOver = dragOver === q
        return (
          <section
            key={q}
            data-testid={`quadrant-${q}`}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(q)
            }}
            onDragLeave={() => setDragOver((cur) => (cur === q ? null : cur))}
            onDrop={(e) => {
              e.preventDefault()
              void handleDrop(q)
            }}
            className={[
              'rounded-lg border p-3 transition-colors',
              q === 'A' ? 'border-red-300 bg-red-50/40' : '',
              q === 'B' ? 'border-blue-300 bg-blue-50/40' : '',
              q === 'C' ? 'border-amber-300 bg-amber-50/40' : '',
              q === 'D' ? 'border-zinc-300 bg-zinc-50/40' : '',
              isOver ? 'ring-2 ring-offset-1 ring-slate-900' : '',
            ].join(' ')}
          >
            <header className="mb-2">
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold">{q}</span>
                <span className="text-sm font-medium">{meta.label}</span>
              </div>
              <p className="text-xs text-muted-foreground">{meta.hint}</p>
            </header>

            {grouped[q].length === 0 ? (
              <p className="text-xs italic text-muted-foreground">Chưa có công việc</p>
            ) : (
              <ul className="space-y-1">
                {grouped[q].map((task) => (
                  <li
                    key={task.id}
                    data-testid={`task-${task.id}`}
                    draggable
                    onDragStart={() => {
                      draggingId.current = task.id
                    }}
                    onDragEnd={() => {
                      draggingId.current = null
                      setDragOver(null)
                    }}
                    className="cursor-grab rounded border bg-white px-2 py-1.5 text-sm shadow-sm"
                  >
                    {task.title}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )
      })}
      </div>
    </div>
  )
}
