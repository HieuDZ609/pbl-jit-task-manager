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

/** Thứ Hai 00:00 của tuần chứa `d` (tuần bắt đầu từ thứ Hai — quy ước VN). */
export function startOfWeek(d: Date): Date {
  const copy = new Date(d)
  copy.setHours(0, 0, 0, 0)
  const offset = (copy.getDay() + 6) % 7
  copy.setDate(copy.getDate() - offset)
  return copy
}

export function addDays(d: Date, n: number): Date {
  const copy = new Date(d)
  copy.setDate(copy.getDate() + n)
  return copy
}

export function addMonths(d: Date, n: number): Date {
  const copy = new Date(d)
  copy.setMonth(copy.getMonth() + n)
  return copy
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

/** 7 ngày (thứ Hai → Chủ Nhật) của tuần chứa `d`. */
export function weekDates(d: Date): Date[] {
  const monday = startOfWeek(d)
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i))
}

/** Lưới 6 tuần (42 ngày, thứ Hai → Chủ Nhật) phủ nguyên tháng chứa `d`. */
export function monthGridDates(d: Date): Date[] {
  const gridStart = startOfWeek(startOfMonth(d))
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))
}

const WEEKDAY_NAMES = [
  'Chủ Nhật',
  'Thứ Hai',
  'Thứ Ba',
  'Thứ Tư',
  'Thứ Năm',
  'Thứ Sáu',
  'Thứ Bảy',
] as const

const WEEKDAY_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'] as const

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/** `2026-10-05` (giờ địa phương) — dùng cho `data-testid` ổn định. */
export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

/** `05/10/2026`. */
export function formatDate(d: Date): string {
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`
}

/** `Thứ Hai, 05/10/2026`. */
export function formatDayLabel(d: Date): string {
  return `${WEEKDAY_NAMES[d.getDay()]}, ${formatDate(d)}`
}

/** `Tháng 10, 2026`. */
export function formatMonthLabel(d: Date): string {
  return `Tháng ${d.getMonth() + 1}, ${d.getFullYear()}`
}

export function weekdayShort(d: Date): string {
  return WEEKDAY_SHORT[d.getDay()]
}
