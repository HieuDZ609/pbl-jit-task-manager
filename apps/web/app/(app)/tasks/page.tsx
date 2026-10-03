import { getTasks } from '@/server/actions/task-actions'
import { TaskList } from '@/features/tasks/task-list'

export default async function TasksPage() {
  const tasks = await getTasks()
  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold">Tasks</h1>
      <TaskList initialTasks={tasks} />
    </section>
  )
}
