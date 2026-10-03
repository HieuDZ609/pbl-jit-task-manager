export type Habit = {
  id: string
  name: string
  color: string | null
  icon: string | null
  frequency: 'daily' | 'weekly'
  targetCount: number
  startDate: Date
  archived: boolean
}

export type HabitLog = {
  id: string
  habitId: string
  date: Date
  count: number
}

export type CreateHabitInput = {
  name: string
  frequency?: 'daily' | 'weekly'
  targetCount?: number
  color?: string | null
}

export interface HabitRepository {
  create(input: CreateHabitInput): Promise<Habit>
  listActive(): Promise<Habit[]>
  findById(id: string): Promise<Habit | null>
  archive(id: string): Promise<void>
  checkIn(habitId: string, date: Date, increment?: number): Promise<HabitLog>
  logsFor(habitId: string): Promise<HabitLog[]>
  setCount(habitId: string, date: Date, count: number): Promise<HabitLog>
}
