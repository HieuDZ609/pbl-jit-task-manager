import { toDateKey } from '@/features/habits/streak'
import type { Task } from '@/features/tasks/types'
import type { FocusSession } from '@/features/focus/types'
import type { Habit, HabitLog } from '@/features/habits/types'

export type StatsInput = {
  tasks: Task[]
  focusSessions: FocusSession[]
  habits: Habit[]
  habitLogs: Record<string, HabitLog[]>
}

export type Stats = {
  completedToday: number
  completedThisWeek: number
  overdue: number
  focusMinutesToday: number
  quadrants: { A: number; B: number; C: number; D: number }
  habitCompletionRate: number
}

function startOfWeek(d: Date): Date {
  const copy = new Date(d)
  const day = copy.getDay()
  const diff = day === 0 ? -6 : 1 - day
  copy.setDate(copy.getDate() + diff)
  copy.setHours(0, 0, 0, 0)
  return copy
}

export function computeStats(input: StatsInput, now: Date): Stats {
  const todayKey = toDateKey(now)
  const weekStart = startOfWeek(now).getTime()

  const open = input.tasks.filter((t) => !t.isDone)

  const quadrants = { A: 0, B: 0, C: 0, D: 0 }
  for (const t of open) {
    if (t.eisenhowerQuadrant) quadrants[t.eisenhowerQuadrant] += 1
  }

  const activeHabits = input.habits.filter((h) => !h.archived)
  const habitsDone = activeHabits.filter((h) => {
    const logs = input.habitLogs[h.id] ?? []
    const todayLog = logs.find((l) => toDateKey(l.date) === todayKey)
    return (todayLog?.count ?? 0) >= h.targetCount
  }).length

  return {
    completedToday: input.tasks.filter(
      (t) => t.isDone && t.doneAt && toDateKey(t.doneAt) === todayKey,
    ).length,
    completedThisWeek: input.tasks.filter((t) => t.isDone && t.doneAt && t.doneAt.getTime() >= weekStart).length,
    overdue: open.filter((t) => t.dueAt && t.dueAt.getTime() < now.getTime()).length,
    focusMinutesToday: input.focusSessions
      .filter((s) => toDateKey(s.startedAt) === todayKey && s.mode === 'work' && s.completed)
      .reduce((sum, s) => sum + s.durationMin, 0),
    quadrants,
    habitCompletionRate:
      activeHabits.length === 0 ? 0 : Math.round((habitsDone / activeHabits.length) * 100),
  }
}
