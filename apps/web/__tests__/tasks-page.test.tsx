import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import type { Task } from '@/features/tasks/types'

const createTask = vi.fn()
const setTaskDone = vi.fn()
const deleteTask = vi.fn()

const existing: Task = {
  id: 't1',
  title: 'Viết báo cáo',
  content: null,
  eisenhowerQuadrant: null,
  dueAt: null,
  startAt: null,
  remindAt: null,
  isDone: false,
  doneAt: null,
  parentId: null,
  listId: null,
  myDayAt: null,
  deletedAt: null,
}

vi.mock('@/server/actions/folder-list-actions', () => ({
  getFolderTree: async () => [],
  getRootLists: async () => [],
  createFolder: vi.fn(),
  createList: vi.fn(),
  renameFolder: vi.fn(),
  renameList: vi.fn(),
  deleteFolder: vi.fn(),
  deleteList: vi.fn(),
}))

vi.mock('@/server/actions/task-actions', () => ({
  getTasks: async () => [existing],
  createTask: async (title: string) => {
    await createTask(title)
    return { ...existing, id: 't2', title }
  },
  setTaskDone: async (id: string, isDone: boolean) => {
    await setTaskDone(id, isDone)
  },
  deleteTask: async (id: string) => {
    await deleteTask(id)
  },
  setTaskQuadrant: vi.fn(),
  addChecklistItem: vi.fn(),
  getSmartList: vi.fn(),
  blockTaskOnDay: vi.fn(),
}))

const { default: TasksPage } = await import('../app/(app)/tasks/page')

async function renderPage() {
  render(await TasksPage())
}

describe('TasksPage nối server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('gọi createTask khi thêm công việc', async () => {
    await renderPage()
    await userEvent.type(screen.getByLabelText(/title/i), 'Việc mới')
    await userEvent.click(screen.getByRole('button', { name: /add/i }))
    expect(createTask).toHaveBeenCalledWith('Việc mới')
  })

  it('gọi setTaskDone khi toggle', async () => {
    await renderPage()
    await userEvent.click(screen.getByLabelText('Toggle Viết báo cáo'))
    expect(setTaskDone).toHaveBeenCalledWith('t1', true)
  })

  it('gọi deleteTask khi xoá', async () => {
    await renderPage()
    await userEvent.click(screen.getByLabelText('Delete Viết báo cáo'))
    expect(deleteTask).toHaveBeenCalledWith('t1')
  })

  it('hiện lỗi và giữ nguyên task khi server action thất bại', async () => {
    createTask.mockRejectedValueOnce(new Error('DB down'))
    await renderPage()
    await userEvent.type(screen.getByLabelText(/title/i), 'Sẽ lỗi')
    await userEvent.click(screen.getByRole('button', { name: /add/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/không tạo được/i)
    expect(screen.getByText('Viết báo cáo')).toBeInTheDocument()
  })
})