'use client'

import type { Habit, HabitLog } from '@/features/habits/types'
import { buildHeatmap, currentStreak, longestStreak, toDateKey } from './streak'
import { Heatmap } from './heatmap'

type Props = {
  habits: Habit[]
  logsByHabit: Record<string, HabitLog[]>
  today: Date
  heatmapDays?: number
  onCheckIn?: (habitId: string) => void
  onUndo?: (habitId: string) => void
}

export function HabitTracker({
  habits,
  logsByHabit,
  today,
  heatmapDays = 91,
  onCheckIn,
  onUndo,
}: Props) {
  if (habits.length === 0) {
    return <p className="text-sm text-muted-foreground">Chưa có thói quen nào. Thêm thói quen đầu tiên.</p>
  }

  const todayKey = toDateKey(today)

  return (
    <div className="space-y-4">
      {habits.map((habit) => {
        const logs = logsByHabit[habit.id] ?? []
        const dateKeys = logs.map((l) => toDateKey(l.date))
        const todayLog = logs.find((l) => toDateKey(l.date) === todayKey)
        const doneToday = Boolean(todayLog && todayLog.count > 0)
        const cells = buildHeatmap(dateKeys, heatmapDays, today)

        return (
          <article key={habit.id} className="space-y-2 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <button
                type="button"
                aria-pressed={doneToday}
                aria-label={`${habit.name}`}
                onClick={() => (doneToday ? onUndo?.(habit.id) : onCheckIn?.(habit.id))}
                className={[
                  'rounded border px-3 py-1 text-sm font-medium',
                  doneToday ? 'bg-emerald-600 text-white' : '',
                ].join(' ')}
              >
                {habit.name}
              </button>
              <div className="flex gap-3 text-xs text-muted-foreground">
                <span data-testid={`streak-${habit.id}`}>🔥 {currentStreak(dateKeys, today)}</span>
                <span data-testid={`longest-${habit.id}`}>🏆 {longestStreak(dateKeys)}</span>
                <span data-testid={`progress-${habit.id}`}>
                  {todayLog?.count ?? 0}/{habit.targetCount}
                </span>
              </div>
            </div>
            <Heatmap cells={cells} />
          </article>
        )
      })}
    </div>
  )
}
