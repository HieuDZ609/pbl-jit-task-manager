import type { Task } from '@/features/tasks/types'

export type HourSlot = {
  hour: number
  label: string
}

export function buildHourSlots(): HourSlot[] {
  return Array.from({ length: 24 }, (_, hour) => ({
    hour,
    label: `${String(hour).padStart(2, '0')}:00`,
  }))
}

function atHour(day: Date, hour: number): Date {
  const d = new Date(day)
  d.setHours(hour, 0, 0, 0)
  return d
}

export function blockTask(
  tasks: Task[],
  taskId: string,
  startHour: number,
  durationMinutes: number,
  day: Date,
): Task[] {
  const found = tasks.find((t) => t.id === taskId)
  if (!found) return tasks
  const start = atHour(day, startHour)
  const end = new Date(start.getTime() + durationMinutes * 60_000)
  return tasks.map((t) => (t.id === taskId ? { ...t, startAt: start, dueAt: end } : t))
}

export function unblockTask(tasks: Task[], taskId: string): Task[] {
  const found = tasks.find((t) => t.id === taskId)
  if (!found) return tasks
  return tasks.map((t) => (t.id === taskId ? { ...t, startAt: null, dueAt: null } : t))
}

function startOfDay(d: Date): number {
  const copy = new Date(d)
  copy.setHours(0, 0, 0, 0)
  return copy.getTime()
}

function endOfDay(d: Date): number {
  const copy = new Date(d)
  copy.setHours(23, 59, 59, 999)
  return copy.getTime()
}

export function tasksForDay(tasks: Task[], day: Date): Task[] {
  const from = startOfDay(day)
  const to = endOfDay(day)
  return tasks.filter((t) => {
    if (t.deletedAt) return false
    const start = t.startAt?.getTime()
    const due = t.dueAt?.getTime()
    if (start == null && due == null) return false
    if (start != null && start > to) return false
    if (due != null && due < from) return false
    return true
  })
}
