import { getTasks, blockTaskOnDay } from '@/server/actions/task-actions'
import { CalendarView } from '@/features/calendar/calendar-view'

export default async function CalendarPage() {
  const tasks = await getTasks()
  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Lịch &amp; Time-blocking</h1>
        <p className="text-sm text-muted-foreground">
          Quản lý 24 giờ trong ngày bằng cách kéo thả công việc vào khung giờ.
        </p>
      </div>
      <CalendarView initialTasks={tasks} day={new Date()} onBlock={blockTaskOnDay} />
    </section>
  )
}
