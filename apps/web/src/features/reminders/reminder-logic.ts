export type ReminderRepeat = 'none' | 'daily' | 'weekly'

type ReminderLike = {
  dueAt: Date
  repeat: ReminderRepeat
  done: boolean
}

export function isOverdue(reminder: ReminderLike, now: Date): boolean {
  if (reminder.done) return false
  return reminder.dueAt.getTime() < now.getTime()
}

export function isDueSoon(dueAt: Date, now: Date, windowMinutes = 60): boolean {
  const diff = dueAt.getTime() - now.getTime()
  return diff > 0 && diff <= windowMinutes * 60_000
}

export function sortByDue<T extends ReminderLike>(reminders: T[]): T[] {
  return [...reminders].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1
    return a.dueAt.getTime() - b.dueAt.getTime()
  })
}

export function snoozeUntil(now: Date, minutes = 10): Date {
  return new Date(now.getTime() + minutes * 60_000)
}

export function nextOccurrence(reminder: ReminderLike, now: Date): Date | null {
  if (reminder.repeat === 'none') return null
  const step = (reminder.repeat === 'daily' ? 1 : 7) * 24 * 60 * 60_000
  // Luôn tiến từ dueAt gốc để giữ đúng giờ, và nhảy qua các lần đã trôi qua
  // thay vì cộng một lần từ `now` (làm lệch giờ của nhắc lặp lại).
  let next = reminder.dueAt.getTime()
  if (next <= now.getTime()) {
    const missed = Math.floor((now.getTime() - next) / step) + 1
    next += missed * step
  } else {
    next += step
  }
  return new Date(next)
}

export function describeReminder(reminder: ReminderLike, now: Date): string {
  if (isOverdue(reminder, now)) return 'Đã quá hạn'
  if (isDueSoon(reminder.dueAt, now)) return 'Sắp đến hạn'
  return 'Còn lâu'
}
