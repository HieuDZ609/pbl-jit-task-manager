import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TaskList } from '../task-list'
import type { Task } from '../types'

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

describe('TaskList callbacks', () => {
  it('toggles a task optimistically and calls onToggle', async () => {
    const onToggle = vi.fn()
    render(<TaskList initialTasks={[task()]} onToggle={onToggle} />)
    await userEvent.click(screen.getByLabelText('Toggle Viết báo cáo'))
    expect(onToggle).toHaveBeenCalledWith('t1', true)
    expect(screen.getByLabelText('Toggle Viết báo cáo')).toBeChecked()
  })

  it('removes a task and calls onDelete', async () => {
    const onDelete = vi.fn()
    render(<TaskList initialTasks={[task()]} onDelete={onDelete} />)
    await userEvent.click(screen.getByLabelText('Delete Viết báo cáo'))
    expect(onDelete).toHaveBeenCalledWith('t1')
    expect(screen.getByText(/chưa có công việc nào/i)).toBeInTheDocument()
  })

  it('calls onCreate when submitting the add form', async () => {
    const onCreate = vi.fn()
    render(<TaskList initialTasks={[task()]} onCreate={onCreate} />)
    await userEvent.type(screen.getByLabelText(/title/i), 'Việc mới')
    await userEvent.click(screen.getByRole('button', { name: /add/i }))
    expect(onCreate).toHaveBeenCalledWith('Việc mới')
  })

  it('does not crash when onToggle is absent', async () => {
    render(<TaskList initialTasks={[task()]} />)
    await userEvent.click(screen.getByLabelText('Toggle Viết báo cáo'))
    expect(screen.getByLabelText('Toggle Viết báo cáo')).toBeChecked()
  })

  it('does not crash when onDelete is absent', async () => {
    render(<TaskList initialTasks={[task()]} />)
    await userEvent.click(screen.getByLabelText('Delete Viết báo cáo'))
    expect(screen.getByText(/chưa có công việc nào/i)).toBeInTheDocument()
  })

  it('does not crash when onCreate is absent', async () => {
    render(<TaskList initialTasks={[task()]} />)
    await userEvent.type(screen.getByLabelText(/title/i), 'Không callback')
    await userEvent.click(screen.getByRole('button', { name: /add/i }))
    expect(screen.getByText('Viết báo cáo')).toBeInTheDocument()
  })

  it('renders the quadrant badge when set', () => {
    render(<TaskList initialTasks={[task({ eisenhowerQuadrant: 'A' })]} />)
    expect(screen.getByText('A')).toBeInTheDocument()
  })

  it('strikes through a done task', () => {
    render(<TaskList initialTasks={[task({ isDone: true })]} />)
    expect(screen.getByText('Viết báo cáo')).toHaveClass('line-through')
  })
})
