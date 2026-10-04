import { getTasks } from '@/server/actions/task-actions'
import { setTaskQuadrant } from '@/server/actions/task-actions'
import { MatrixGrid } from '@/features/matrix/matrix-grid'

// Đọc dữ liệu theo user ở server nên phải render mỗi request. Không có dòng
// này Next thử prerender lúc `next build`, gọi `currentUserId()` khi chưa có
// đăng nhập và làm build vỡ.
export const dynamic = 'force-dynamic'

export default async function MatrixPage() {
  const tasks = await getTasks()
  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Ma trận Eisenhower</h1>
        <p className="text-sm text-muted-foreground">
          Kéo thả công việc vào 4 ô để phân loại theo mức độ khẩn cấp &amp; quan trọng.
        </p>
      </div>
      <MatrixGrid initialTasks={tasks} onMove={setTaskQuadrant} />
    </section>
  )
}
