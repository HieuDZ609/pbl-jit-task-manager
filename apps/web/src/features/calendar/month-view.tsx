'use client'

import { monthGridDates, tasksForDay, dateKey } from './time-blocking'
import type { Task } from '@/features/tasks/types'

const WEEKDAY_SHORT = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'] as const

type Props = {
  tasks: Task[]
  month: Date
  onSelectDay?: (day: Date) => void
}

export function MonthView({ tasks, month, onSelectDay }: Props) {
  const days = monthGridDates(month)
  const inMonth = month.getMonth()
  const inYear = month.getFullYear()

  return (
    <div data-testid="month-grid" className="rounded border">
      <div className="grid grid-cols-7 border-b bg-slate-50">
        {WEEKDAY_SHORT.map((label) => (
          <div key={label} className="px-2 py-1 text-center text-xs font-semibold text-muted-foreground">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const outside = day.getMonth() !== inMonth || day.getFullYear() !== inYear
          const dayTasks = tasksForDay(tasks, day)
          return (
            <button
              key={dateKey(day)}
              type="button"
              data-testid={`month-day-${dateKey(day)}`}
              data-month-cell
              data-outside={outside ? 'true' : undefined}
              onClick={() => onSelectDay?.(day)}
              className={[
                'min-h-[4.5rem] border-b border-r p-1 text-left align-top',
                outside ? 'bg-slate-50 text-muted-foreground' : 'hover:bg-slate-100',
              ].join(' ')}
            >
              <span className="text-xs font-medium">{day.getDate()}</span>
              <div className="mt-0.5 space-y-0.5">
                {dayTasks.slice(0, 3).map((t) => (
                  <span
                    key={t.id}
                    className="block truncate rounded bg-slate-900 px-1 py-0.5 text-[11px] text-white"
                    title={t.title}
                  >
                    {t.title}
                  </span>
                ))}
                {dayTasks.length > 3 ? (
                  <span className="block text-[11px] text-muted-foreground">
                    +{dayTasks.length - 3}
                  </span>
                ) : null}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}