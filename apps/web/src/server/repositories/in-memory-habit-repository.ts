import { randomUUID } from 'node:crypto'
import type {
  CreateHabitInput,
  Habit,
  HabitLog,
  HabitRepository,
} from './habit-repository'

/**
 * Khoá ngày theo **UTC**, khớp cột `habit_logs.date` và adapter Drizzle.
 *
 * Trước đây hàm này dùng `getFullYear/getMonth/getDate` (giờ local). Ở múi giờ
 * không UTC thì một log lúc 23:30 có thể rơi sang ngày hôm trước hoặc hôm sau ở
 * DB, khiến "check-in hai lần trong ngày" thành hai log khác ngày và streak sai.
 * Ngày luôn quy về UTC midnight, giống `utcDay()` bên `DrizzleHabitRepository`.
 */
function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** Ngày UTC midnight — giá trị thực sự lưu vào cột `date`. */
function utcDay(d: Date): Date {
  return new Date(`${dayKey(d)}T00:00:00.000Z`)
}

export class InMemoryHabitRepository implements HabitRepository {
  private habits: Habit[] = []
  private logs: HabitLog[] = []

  async create(input: CreateHabitInput): Promise<Habit> {
    const habit: Habit = {
      id: randomUUID(),
      name: input.name,
      color: input.color ?? null,
      icon: null,
      frequency: input.frequency ?? 'daily',
      targetCount: input.targetCount ?? 1,
      startDate: new Date(),
      archived: false,
    }
    this.habits.push(habit)
    return habit
  }

  async listActive(): Promise<Habit[]> {
    return this.habits.filter((h) => !h.archived)
  }

  async findById(id: string): Promise<Habit | null> {
    return this.habits.find((h) => h.id === id) ?? null
  }

  async archive(id: string): Promise<void> {
    const habit = this.habits.find((h) => h.id === id)
    if (!habit) throw new Error(`Habit not found: ${id}`)
    habit.archived = true
  }

  async checkIn(habitId: string, date: Date, increment = 1): Promise<HabitLog> {
    this.requireHabit(habitId)
    const key = dayKey(date)
    const existing = this.logs.find((l) => l.habitId === habitId && dayKey(l.date) === key)
    if (existing) {
      existing.count += increment
      return existing
    }
    const log: HabitLog = { id: randomUUID(), habitId, date: utcDay(date), count: increment }
    this.logs.push(log)
    return log
  }

  async setCount(habitId: string, date: Date, count: number): Promise<HabitLog> {
    this.requireHabit(habitId)
    const key = dayKey(date)
    const existing = this.logs.find((l) => l.habitId === habitId && dayKey(l.date) === key)
    if (existing) {
      existing.count = count
      return existing
    }
    const log: HabitLog = { id: randomUUID(), habitId, date: utcDay(date), count }
    this.logs.push(log)
    return log
  }

  async logsFor(habitId: string): Promise<HabitLog[]> {
    return this.logs.filter((l) => l.habitId === habitId)
  }

  private requireHabit(id: string): Habit {
    const habit = this.habits.find((h) => h.id === id)
    if (!habit) throw new Error(`Habit not found: ${id}`)
    return habit
  }
}
