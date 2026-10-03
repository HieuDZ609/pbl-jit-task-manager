import type { SmartListKey, Task } from './types'

function startOfDay(d: Date): Date {
  const copy = new Date(d)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function addDays(d: Date, days: number): Date {
  const copy = new Date(d)
  copy.setDate(copy.getDate() + days)
  return copy
}

function isSameDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime()
}

function alive(t: Task): boolean {
  return !t.deletedAt
}

export function selectSmartList(
  tasks: Task[],
  key: SmartListKey,
  now: Date = new Date(),
): Task[] {
  switch (key) {
    case 'today':
      return tasks.filter((t) => alive(t) && !t.isDone && t.dueAt != null && isSameDay(t.dueAt, now))
    case 'tomorrow':
      return tasks.filter((t) => alive(t) && !t.isDone && t.dueAt != null && isSameDay(t.dueAt, addDays(now, 1)))
    // So sánh theo mốc thời gian để khớp với stat "quá hạn" trên dashboard
    // (src/features/dashboard/stats.ts) — cả hai cùng nghĩa là đã qua giờ hạn.
    case 'overdue':
      return tasks.filter(
        (t) => alive(t) && !t.isDone && t.dueAt != null && t.dueAt.getTime() < now.getTime(),
      )
    case 'upcoming':
      return tasks.filter((t) => alive(t) && !t.isDone && t.dueAt != null && isAfterTomorrow(t.dueAt, now))
    case 'completed':
      return tasks.filter((t) => alive(t) && t.isDone)
    case 'all':
      return tasks.filter((t) => alive(t))
  }
}

function isAfterTomorrow(d: Date, now: Date): boolean {
  const tomorrowEnd = addDays(startOfDay(now), 2)
  return d.getTime() >= tomorrowEnd.getTime()
}
