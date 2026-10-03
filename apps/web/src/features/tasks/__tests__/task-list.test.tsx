import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TaskList } from '../task-list'
import type { Task } from '../types'

const tasks: Task[] = [
  { id: '1', title: 'Viết báo cáo', isDone: false, deletedAt: null },
  { id: '2', title: 'Làm slide', isDone: true, deletedAt: null },
]

describe('TaskList', () => {
  it('renders task titles', () => {
    render(<TaskList initialTasks={tasks} />)
    expect(screen.getByText('Viết báo cáo')).toBeInTheDocument()
    expect(screen.getByText('Làm slide')).toBeInTheDocument()
  })

  it('shows done state via checkbox', () => {
    render(<TaskList initialTasks={tasks} />)
    const boxes = screen.getAllByRole('checkbox')
    expect(boxes[0]).not.toBeChecked()
    expect(boxes[1]).toBeChecked()
  })

  it('calls onToggle with task id and new state', async () => {
    const onToggle = vi.fn().mockResolvedValue(undefined)
    render(<TaskList initialTasks={tasks} onToggle={onToggle} />)
    await userEvent.click(screen.getAllByRole('checkbox')[0])
    expect(onToggle).toHaveBeenCalledWith('1', true)
  })

  it('renders empty state', () => {
    render(<TaskList initialTasks={[]} />)
    expect(screen.getByText(/chưa có công việc/i)).toBeInTheDocument()
  })

  it('shows quadrant badge when set', () => {
    const withQ: Task[] = [{ id: '3', title: 'Urgent', isDone: false, eisenhowerQuadrant: 'A', deletedAt: null }]
    render(<TaskList initialTasks={withQ} />)
    expect(screen.getByText('A')).toBeInTheDocument()
  })
})
