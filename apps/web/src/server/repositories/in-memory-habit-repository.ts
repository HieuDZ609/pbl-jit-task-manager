import { randomUUID } from 'node:crypto'
import type {
  CreateHabitInput,
  Habit,
  HabitLog,
  HabitRepository,
} from './habit-repository'

function dayKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
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
    const log: HabitLog = { id: randomUUID(), habitId, date, count: increment }
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
    const log: HabitLog = { id: randomUUID(), habitId, date, count }
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
