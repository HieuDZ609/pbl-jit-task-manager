import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { TaskDetailPanel } from '../task-detail-panel'
import type { ChecklistItem } from '../checklist-types'
import type { Task } from '../types'

const subtask = (over: Partial<Task> = {}): Task => ({
  id: 'c1',
  title: 'Việc con',
  content: null,
  eisenhowerQuadrant: null,
  dueAt: null,
  startAt: null,
  remindAt: null,
  isDone: false,
  doneAt: null,
  parentId: 't1',
  listId: null,
  myDayAt: null,
  deletedAt: null,
  ...over,
})

const item = (over: Partial<ChecklistItem> = {}): ChecklistItem => ({
  id: 'i1',
  taskId: 't1',
  title: 'Mục A',
  isDone: false,
  sortOrder: 0,
  ...over,
})

const actions = {
  onAddChecklistItem: vi.fn(async () => item({ id: 'i2', title: 'Mục mới' })),
  onToggleChecklistItem: vi.fn(),
  onRemoveChecklistItem: vi.fn(),
  onAddSubtask: vi.fn(async () => subtask({ id: 'c2', title: 'Sub mới' })),
  onToggleSubtask: vi.fn(),
}

function renderPanel() {
  return render(
    <TaskDetailPanel
      task={subtask({ id: 't1', parentId: null, title: 'Task cha' })}
      checklist={[item()]}
      subtasks={[subtask()]}
      {...actions}
    />,
  )
}

describe('TaskDetailPanel', () => {
  beforeEach(() => vi.clearAllMocks())

  it('hiện task cha, checklist và subtask', () => {
    renderPanel()
    expect(screen.getByText('Task cha')).toBeInTheDocument()
    expect(screen.getByText('Mục A')).toBeInTheDocument()
    expect(screen.getByText('Việc con')).toBeInTheDocument()
  })

  it('thêm checklist item', async () => {
    renderPanel()
    await userEvent.type(screen.getByLabelText(/mục checklist/i), 'Mục mới')
    await userEvent.click(screen.getByRole('button', { name: /thêm mục/i }))
    expect(actions.onAddChecklistItem).toHaveBeenCalledWith('t1', 'Mục mới')
  })

  it('không gọi action khi mục checklist rỗng', async () => {
    renderPanel()
    await userEvent.click(screen.getByRole('button', { name: /thêm mục/i }))
    expect(actions.onAddChecklistItem).not.toHaveBeenCalled()
  })

  it('toggle checklist item', async () => {
    renderPanel()
    await userEvent.click(screen.getByLabelText('Toggle mục Mục A'))
    expect(actions.onToggleChecklistItem).toHaveBeenCalledWith('i1', true)
  })

  it('xoá checklist item', async () => {
    renderPanel()
    await userEvent.click(screen.getByLabelText('Xoá mục Mục A'))
    expect(actions.onRemoveChecklistItem).toHaveBeenCalledWith('i1')
  })

  it('thêm subtask', async () => {
    renderPanel()
    await userEvent.type(screen.getByLabelText(/tên subtask mới/i), 'Sub mới')
    await userEvent.click(screen.getByRole('button', { name: /thêm subtask/i }))
    expect(actions.onAddSubtask).toHaveBeenCalledWith('t1', 'Sub mới')
  })

  it('toggle subtask', async () => {
    renderPanel()
    await userEvent.click(screen.getByLabelText('Toggle subtask Việc con'))
    expect(actions.onToggleSubtask).toHaveBeenCalledWith('c1', true)
  })

  it('toggle subtask cập nhật ngay, không chờ action xong', async () => {
    actions.onToggleSubtask.mockReturnValueOnce(new Promise<void>(() => {}))
    renderPanel()
    await userEvent.click(screen.getByLabelText('Toggle subtask Việc con'))
    expect(screen.getByLabelText('Toggle subtask Việc con')).toBeChecked()
  })

it('rollback subtask khi action thất bại', async () => {
    actions.onToggleSubtask.mockRejectedValueOnce(new Error('DB down'))
    renderPanel()
    await userEvent.click(screen.getByLabelText('Toggle subtask Việc con'))
    expect(screen.getByRole('alert')).toHaveTextContent(/DB down/)
    expect(screen.getByLabelText('Toggle subtask Việc con')).not.toBeChecked()
  })

it('ẩn phần thêm subtask khi bản thân là subtask (chặn nest 3 cấp)', () => {
    render(
      <TaskDetailPanel
        task={subtask({ id: 'c1', parentId: 't0', title: 'Con' })}
        checklist={[]}
        subtasks={[]}
        {...actions}
      />,
    )
    expect(screen.queryByLabelText(/subtask/i)).not.toBeInTheDocument()
  })

  it('hiện lỗi khi action thất bại', async () => {
    actions.onAddChecklistItem.mockRejectedValueOnce(new Error('quá 100 ký tự'))
    renderPanel()
    await userEvent.type(screen.getByLabelText(/mục checklist/i), 'x')
    await userEvent.click(screen.getByRole('button', { name: /thêm mục/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/quá 100 ký tự/)
  })
})