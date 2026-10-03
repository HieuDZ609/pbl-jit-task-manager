import { redirect } from 'next/navigation'
import { checkInHabit, createHabit, undoHabitCheckIn } from '@/server/actions/habit-actions'
import { repos } from '@/server/repositories'
import { HabitForm } from '@/features/habits/habit-form'
import { HabitTracker } from '@/features/habits/habit-tracker'
import type { HabitLog } from '@/server/repositories/habit-repository'

export const dynamic = 'force-dynamic'

export default async function HabitsPage() {
  const habits = await repos.habits.listActive()

  const logsByHabit: Record<string, HabitLog[]> = {}
  for (const habit of habits) {
    logsByHabit[habit.id] = await repos.habits.logsFor(habit.id)
  }

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Thói quen</h1>
        <p className="text-sm text-muted-foreground">
          Theo dõi chuỗi ngày liên tục và lịch sử 12 tuần.
        </p>
      </div>

      <HabitForm
        onCreate={async (name) => {
          'use server'
          await createHabit({ name })
          redirect('/habits')
        }}
      />

      <HabitTracker
        habits={habits}
        logsByHabit={logsByHabit}
        today={new Date()}
        onCheckIn={(habitId) => {
          'use server'
          void checkInHabit(habitId)
        }}
        onUndo={(habitId) => {
          'use server'
          void undoHabitCheckIn(habitId)
        }}
      />
    </section>
  )
}
