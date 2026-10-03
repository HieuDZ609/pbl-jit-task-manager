import { redirect } from 'next/navigation'
import { quickAddToMyDay, toggleMyDayTask } from '@/server/actions/myday-actions'
import { repos } from '@/server/repositories'
import { MyDay } from '@/features/dashboard/my-day'

export const dynamic = 'force-dynamic'

export default async function MyDayPage() {
  const tasks = await repos.tasks.list()

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Hôm nay</h1>
        <p className="text-sm text-muted-foreground">Chỉ những việc bạn chủ động ghim cho hôm nay.</p>
      </div>

      <MyDay
        tasks={tasks}
        today={new Date()}
        onQuickAdd={async (title) => {
          'use server'
          await quickAddToMyDay(title)
          redirect('/myday')
        }}
        onToggle={(taskId) => {
          'use server'
          void toggleMyDayTask(taskId)
        }}
      />
    </section>
  )
}
