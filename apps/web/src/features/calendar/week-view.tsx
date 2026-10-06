'use client'

import { useRef, useState } from 'react'
import { buildHourSlots, tasksForDay, weekDates, dateKey, weekdayShort } from './time-blocking'
import type { Task } from '@/features/tasks/types'

type Props = {
  tasks: Task[]
  weekStart: Date
  onBlock?: (taskId: string, startHour: number, durationMinutes: number, day: Date) => Promise<void> | void
  draggableTaskId?: string | null
  durationMinutes?: number
}

export function WeekView({
  tasks,
  weekStart,
  onBlock,
  draggableTaskId = null,
  durationMinutes = 60,
}: Props) {
  const days = weekDates(weekStart)
  const slots = buildHourSlots()
  const draggingId = useRef<string | null>(null)
  const [overSlot, setOverSlot] = useState<string | null>(null)

  function handleDrop(day: Date, hour: number) {
    const id = draggingId.current ?? draggableTaskId
    setOverSlot(null)
    draggingId.current = null
    if (id && onBlock) void onBlock(id, hour, durationMinutes, day)
  }

  return (
    <div className="overflow-x-auto rounded border">
      <div className="grid min-w-[52rem]" style={{ gridTemplateColumns: '3.5rem repeat(7, minmax(0, 1fr))' }}>
        {days.map((day) => {
          const dayTasks = tasksForDay(tasks, day)
          return (
            <div key={dateKey(day)} data-testid={`week-col-${dateKey(day)}`} className="border-l px-1">
              <div className="py-1 text-center">
                <div className="text-xs font-semibold">{weekdayShort(day)}</div>
                <div className="text-xs text-muted-foreground">
                  {day.getDate()}/{day.getMonth() + 1}
                </div>
              </div>
              {slots.map((slot) => {
                const slotTasks = dayTasks.filter((t) => t.startAt?.getHours() === slot.hour)
                const testId = `week-slot-${dateKey(day)}-${slot.hour}`
                return (
                  <div
                    key={testId}
                    data-testid={testId}
                    data-slot
                    onDragOver={(e) => {
                      e.preventDefault()
                      setOverSlot(testId)
                    }}
                    onDragLeave={() => setOverSlot((cur) => (cur === testId ? null : cur))}
                    onDrop={(e) => {
                      e.preventDefault()
                      handleDrop(day, slot.hour)
                    }}
                    className={[
                      'min-h-[2.25rem] border-t px-1 py-0.5',
                      overSlot === testId ? 'bg-blue-50' : '',
                    ].join(' ')}
                  >
                    {slotTasks.map((t) => (
                      <span
                        key={t.id}
                        draggable
                        onDragStart={() => {
                          draggingId.current = t.id
                        }}
                        onDragEnd={() => {
                          draggingId.current = null
                          setOverSlot(null)
                        }}
                        data-testid={`week-task-${t.id}`}
                        className="mb-1 block cursor-grab truncate rounded bg-slate-900 px-1.5 py-0.5 text-xs text-white"
                        title={t.title}
                      >
                        {t.title}
                      </span>
                    ))}
                  </div>
                )
              })}
            </div>
          )
        })}

        <div className="border-l">
          {slots.map((slot) => (
            <div key={slot.hour} className="min-h-[2.25rem] px-1 pt-0.5 text-right text-xs text-muted-foreground">
              {slot.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}