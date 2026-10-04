import { getTasks, blockTaskOnDay } from '@/server/actions/task-actions'
import { CalendarView } from '@/features/calendar/calendar-view'

// Đọc dữ liệu theo user ở server nên phải render mỗi request. Không có dòng
// này Next thử prerender lúc `next build`, gọi `currentUserId()` khi chưa có
// đăng nhập và làm build vỡ.
export const dynamic = 'force-dynamic'

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
