'use client'

import { useState } from 'react'
import { buildHourSlots, tasksForDay } from './time-blocking'
import type { Task } from '@/features/tasks/types'

type ViewMode = 'day' | 'week' | 'month'

type Props = {
  initialTasks: Task[]
  day: Date
  onBlock?: (taskId: string, startHour: number, durationMinutes: number) => Promise<void> | void
  draggableTaskId?: string | null
  durationMinutes?: number
}

const VIEW_LABELS: Record<ViewMode, string> = {
  day: 'Ngày',
  week: 'Tuần',
  month: 'Tháng',
}

function formatTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function CalendarView({
  initialTasks,
  day,
  onBlock,
  draggableTaskId = null,
  durationMinutes = 60,
}: Props) {
  const [view, setView] = useState<ViewMode>('day')
  const [overSlot, setOverSlot] = useState<number | null>(null)
  const [tasks] = useState(initialTasks)

  const slots = buildHourSlots()
  const dayTasks = tasksForDay(tasks, day)

  return (
    <div className="space-y-3">
      <div className="flex gap-1" role="group" aria-label="Chế độ xem">
        {(Object.keys(VIEW_LABELS) as ViewMode[]).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setView(mode)}
            aria-pressed={view === mode}
            className={[
              'rounded px-3 py-1 text-sm',
              view === mode ? 'bg-slate-900 text-white' : 'border',
            ].join(' ')}
          >
            {VIEW_LABELS[mode]}
          </button>
        ))}
      </div>

      {view === 'day' && (
        <div className="divide-y rounded border">
          {slots.map((slot) => {
            const slotTasks = dayTasks.filter((t) => t.startAt?.getHours() === slot.hour)
            return (
              <div
                key={slot.hour}
                data-testid={`slot-${slot.hour}`}
                onDragOver={(e) => {
                  e.preventDefault()
                  setOverSlot(slot.hour)
                }}
                onDragLeave={() => setOverSlot((cur) => (cur === slot.hour ? null : cur))}
                onDrop={(e) => {
                  e.preventDefault()
                  setOverSlot(null)
                  if (draggableTaskId && onBlock) {
                    void onBlock(draggableTaskId, slot.hour, durationMinutes)
                  }
                }}
                className={[
                  'flex min-h-[3rem] items-start gap-3 px-2 py-1',
                  overSlot === slot.hour ? 'bg-blue-50' : '',
                ].join(' ')}
              >
                <span className="w-12 shrink-0 text-xs text-muted-foreground">{slot.label}</span>
                <div className="flex flex-wrap gap-1">
                  {slotTasks.map((t) => (
                    <span
                      key={t.id}
                      className="rounded bg-slate-900 px-2 py-0.5 text-xs text-white"
                    >
                      {t.title}
                      {t.dueAt ? ` · ${formatTime(t.dueAt)}` : ''}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {view !== 'day' && (
        <p className="rounded border p-4 text-sm text-muted-foreground">
          Chế độ {VIEW_LABELS[view]} — sẽ bổ sung ở giai đoạn polish.
        </p>
      )}
    </div>
  )
}
