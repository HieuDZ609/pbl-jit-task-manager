import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { TasksWorkspace } from '../tasks-workspace'
import type { Task } from '../types'
import type { FolderWithLists, List } from '../folder-list-types'

function task(overrides: Partial<Task> = {}): Task {
  return {
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
    ...overrides,
  }
}

const tree: FolderWithLists[] = [
  {
    id: 'f1',
    name: 'Công việc',
    color: null,
    sortOrder: 0,
    lists: [{ id: 'l1', folderId: 'f1', name: 'Cấp bách', color: null, sortOrder: 0 }],
  },
]

const rootLists: List[] = [{ id: 'l0', folderId: null, name: 'Cá nhân', color: null, sortOrder: 0 }]

const actions = {
  onCreate: vi.fn(),
  onToggle: vi.fn(),
  onDelete: vi.fn(),
  onCreateFolder: vi.fn(),
  onRenameFolder: vi.fn(),
  onDeleteFolder: vi.fn(),
  onCreateList: vi.fn(),
  onRenameList: vi.fn(),
  onDeleteList: vi.fn(),
}

function renderWorkspace() {
  return render(
    <TasksWorkspace
      initialTasks={[task(), task({ id: 't2', title: 'Task l1', listId: 'l1' }), task({ id: 't3', title: 'Task l0', listId: 'l0' })]}
      tree={tree}
      rootLists={rootLists}
      {...actions}
    />,
  )
}

describe('TasksWorkspace filter', () => {
  beforeEach(() => vi.clearAllMocks())

  it('mặc định hiện tất cả task', () => {
    renderWorkspace()
    expect(screen.getByText('Viết báo cáo')).toBeInTheDocument()
    expect(screen.getByText('Task l1')).toBeInTheDocument()
    expect(screen.getByText('Task l0')).toBeInTheDocument()
  })

  it('lọc theo list chỉ còn task của list đó', async () => {
    renderWorkspace()
    await userEvent.click(screen.getByRole('button', { name: /lọc.*Cấp bách/i }))
    expect(screen.getByText('Task l1')).toBeInTheDocument()
    expect(screen.queryByText('Viết báo cáo')).not.toBeInTheDocument()
    expect(screen.queryByText('Task l0')).not.toBeInTheDocument()
  })

  it('lọc theo folder lấy cả các list bên trong', async () => {
    renderWorkspace()
    await userEvent.click(screen.getByRole('button', { name: /lọc.*Công việc/i }))
    expect(screen.getByText('Task l1')).toBeInTheDocument()
    expect(screen.queryByText('Task l0')).not.toBeInTheDocument()
  })

  it('bấm Tất cả trả về danh sách đầy đủ', async () => {
    renderWorkspace()
    await userEvent.click(screen.getByRole('button', { name: /lọc.*Cấp bách/i }))
    await userEvent.click(screen.getByRole('button', { name: /tất cả/i }))
    expect(screen.getByText('Viết báo cáo')).toBeInTheDocument()
    expect(screen.getByText('Task l0')).toBeInTheDocument()
  })

  it('vẫn tạo được task khi đang lọc', async () => {
    renderWorkspace()
    await userEvent.click(screen.getByRole('button', { name: /lọc.*Cấp bách/i }))
    await userEvent.type(screen.getByLabelText(/title/i), 'Task mới')
    await userEvent.click(screen.getByRole('button', { name: /add/i }))
    expect(actions.onCreate).toHaveBeenCalledWith('Task mới')
  })
})