'use client'

import { useState } from 'react'
import {
  buildHourSlots,
  tasksForDay,
  addDays,
  addMonths,
  startOfWeek,
  dateKey,
  formatDate,
  formatDayLabel,
  formatMonthLabel,
} from './time-blocking'
import { WeekView } from './week-view'
import { MonthView } from './month-view'
import type { Task } from '@/features/tasks/types'

type ViewMode = 'day' | 'week' | 'month'

type Props = {
  initialTasks: Task[]
  day: Date
  onBlock?: (taskId: string, startHour: number, durationMinutes: number, blockDay?: Date) => Promise<void> | void
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

function periodLabel(view: ViewMode, anchor: Date): string {
  if (view === 'month') return formatMonthLabel(anchor)
  if (view === 'week') {
    const start = startOfWeek(anchor)
    return `${formatDate(start)} — ${formatDate(addDays(start, 6))}`
  }
  return formatDayLabel(anchor)
}

function step(view: ViewMode, anchor: Date, delta: 1 | -1): Date {
  if (view === 'month') return addMonths(anchor, delta)
  if (view === 'week') return addDays(anchor, delta * 7)
  return addDays(anchor, delta)
}

export function CalendarView({
  initialTasks,
  day,
  onBlock,
  draggableTaskId = null,
  durationMinutes = 60,
}: Props) {
  const [view, setView] = useState<ViewMode>('day')
  const [anchor, setAnchor] = useState<Date>(() => new Date(day))
  const [overSlot, setOverSlot] = useState<number | null>(null)

  const tasks = initialTasks

  const slots = buildHourSlots()
  const dayTasks = tasksForDay(tasks, anchor)

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
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

        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Xem trước"
            onClick={() => setAnchor((cur) => step(view, cur, -1))}
            className="rounded border px-2 py-1 text-sm"
          >
            &larr;
          </button>
          <span className="min-w-[11rem] text-center text-sm font-medium">
            {periodLabel(view, anchor)}
          </span>
          <button
            type="button"
            aria-label="Xem sau"
            onClick={() => setAnchor((cur) => step(view, cur, 1))}
            className="rounded border px-2 py-1 text-sm"
          >
            &rarr;
          </button>
        </div>
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
                      data-testid={`day-task-${t.id}`}
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

      {view === 'week' && (
        <WeekView
          tasks={tasks}
          weekStart={startOfWeek(anchor)}
          onBlock={(taskId, startHour, durationMinutes, blockDay) =>
            onBlock?.(taskId, startHour, durationMinutes, blockDay)
          }
          draggableTaskId={draggableTaskId}
          durationMinutes={durationMinutes}
        />
      )}

      {view === 'month' && (
        <MonthView
          tasks={tasks}
          month={anchor}
          onSelectDay={(selected) => {
            setAnchor(selected)
            setView('day')
          }}
        />
      )}

      {view === 'day' && (
        <p className="text-xs text-muted-foreground">
          Ngày {dateKey(anchor)} — kéo task từ danh sách vào khung giờ để chặn thời gian.
        </p>
      )}
    </div>
  )
}