import { getTasks } from '@/server/actions/task-actions'
import { setTaskQuadrant } from '@/server/actions/task-actions'
import { MatrixGrid } from '@/features/matrix/matrix-grid'

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
