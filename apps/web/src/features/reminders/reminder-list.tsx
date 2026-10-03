'use client'

import type { Reminder } from '@/features/reminders/types'
import { describeReminder, sortByDue } from './reminder-logic'

type Props = {
  reminders: Reminder[]
  now: Date
  onDone?: (id: string) => void
  onSnooze?: (id: string, minutes: number) => void
  onDelete?: (id: string) => void
}

const REPEAT_LABEL: Record<Reminder['repeat'], string> = {
  none: '',
  daily: 'lặp hằng ngày',
  weekly: 'lặp hằng tuần',
}

export function ReminderList({ reminders, now, onDone, onSnooze, onDelete }: Props) {
  if (reminders.length === 0) {
    return <p className="text-sm text-muted-foreground">Chưa có nhắc nhở nào.</p>
  }

  const ordered = sortByDue(reminders)

  return (
    <ul className="space-y-2">
      {ordered.map((reminder) => (
        <li
          key={reminder.id}
          data-testid={`reminder-item-${reminder.id}`}
          className={[
            'flex flex-wrap items-center justify-between gap-2 rounded border p-3',
            reminder.done ? 'opacity-60' : '',
          ].join(' ')}
        >
          <div>
            <p className={['text-sm font-medium', reminder.done ? 'line-through' : ''].join(' ')}>
              {reminder.title}
            </p>
            <p className="text-xs text-muted-foreground">
              {new Date(reminder.dueAt).toLocaleString('vi-VN')} · {describeReminder(reminder, now)}
              {REPEAT_LABEL[reminder.repeat] ? ` · ${REPEAT_LABEL[reminder.repeat]}` : ''}
            </p>
          </div>
          {!reminder.done ? (
            <div className="flex gap-1 text-xs">
              <button type="button" onClick={() => onDone?.(reminder.id)}>
                Hoàn thành
              </button>
              <button type="button" onClick={() => onSnooze?.(reminder.id, 10)}>
                Bỏ qua 10p
              </button>
              <button type="button" onClick={() => onSnooze?.(reminder.id, 60)}>
                Bỏ qua 60p
              </button>
              <button type="button" onClick={() => onDelete?.(reminder.id)}>
                Xoá
              </button>
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  )
}
