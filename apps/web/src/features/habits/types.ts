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
