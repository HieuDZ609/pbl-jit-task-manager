import type { Habit, HabitLog, CreateHabitInput } from '@/features/habits/types'

export type { Habit, HabitLog, CreateHabitInput }

export interface HabitRepository {
  create(input: CreateHabitInput): Promise<Habit>
  listActive(): Promise<Habit[]>
  findById(id: string): Promise<Habit | null>
  archive(id: string): Promise<void>
  checkIn(habitId: string, date: Date, increment?: number): Promise<HabitLog>
  logsFor(habitId: string): Promise<HabitLog[]>
  setCount(habitId: string, date: Date, count: number): Promise<HabitLog>
}
