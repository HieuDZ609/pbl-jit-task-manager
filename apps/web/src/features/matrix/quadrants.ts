import type { EisenhowerQuadrant, Task } from '@/features/tasks/types'

export const QUADRANTS: EisenhowerQuadrant[] = ['A', 'B', 'C', 'D']

const META: Record<
  EisenhowerQuadrant,
  { label: string; short: string; hint: string; urgent: boolean; important: boolean }
> = {
  A: {
    label: 'Khẩn cấp & Quan trọng',
    short: 'Làm ngay',
    hint: 'Deadline sắp tới / việc gấp — xử lý đầu tiên',
    urgent: true,
    important: true,
  },
  B: {
    label: 'Quan trọng, không khẩn cấp',
    short: 'Lên kế hoạch',
    hint: 'Quan trọng cho học tập nhưng chưa gấp — cần lịch riêng',
    urgent: false,
    important: true,
  },
  C: {
    label: 'Khẩn cấp, không quan trọng',
    short: 'Ẩn/xử lý nhanh',
    hint: 'Gấp nhưng ít ảnh hưởng — cân nhắc ủy thác hoặc giao',
    urgent: true,
    important: false,
  },
  D: {
    label: 'Không khẩn cấp & không quan trọng',
    short: 'Bỏ qua',
    hint: 'Không cần làm lúc này — xem lại sau',
    urgent: false,
    important: false,
  },
}

export function quadrantMeta(q: EisenhowerQuadrant) {
  return META[q]
}

export type GroupedTasks = Record<EisenhowerQuadrant, Task[]>

export function groupByQuadrant(tasks: Task[]): GroupedTasks {
  const grouped: GroupedTasks = { A: [], B: [], C: [], D: [] }
  for (const task of tasks) {
    if (task.deletedAt) continue
    const q = task.eisenhowerQuadrant
    if (q) grouped[q].push(task)
  }
  return grouped
}

export function moveTaskToQuadrant(
  tasks: Task[],
  taskId: string,
  target: EisenhowerQuadrant,
): Task[] {
  const found = tasks.find((t) => t.id === taskId)
  if (!found || found.eisenhowerQuadrant === target) return tasks
  return tasks.map((t) => (t.id === taskId ? { ...t, eisenhowerQuadrant: target } : t))
}
