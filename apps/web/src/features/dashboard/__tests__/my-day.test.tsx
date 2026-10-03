import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MyDay } from '../my-day'
import type { Task } from '../../tasks/types'

const today = new Date('2026-10-03T09:00:00')

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

describe('MyDay', () => {
  it('shows an empty state', () => {
    render(<MyDay tasks={[]} today={today} onQuickAdd={vi.fn()} onToggle={vi.fn()} />)
    expect(screen.getByText(/hôm nay chưa có việc gì/i)).toBeInTheDocument()
  })

  it('lists a task pinned to today', () => {
    render(
      <MyDay tasks={[task({ myDayAt: today })]} today={today} onQuickAdd={vi.fn()} onToggle={vi.fn()} />,
    )
    expect(screen.getByText('Viết báo cáo')).toBeInTheDocument()
  })

  it('excludes a task not pinned to today', () => {
    render(<MyDay tasks={[task()]} today={today} onQuickAdd={vi.fn()} onToggle={vi.fn()} />)
    expect(screen.queryByText('Viết báo cáo')).not.toBeInTheDocument()
  })

  it('excludes a task pinned to another day', () => {
    render(
      <MyDay
        tasks={[task({ myDayAt: new Date('2026-10-04T09:00:00') })]}
        today={today}
        onQuickAdd={vi.fn()}
        onToggle={vi.fn()}
      />,
    )
    expect(screen.queryByText('Viết báo cáo')).not.toBeInTheDocument()
  })

  it('calls onToggle with the task id', async () => {
    const onToggle = vi.fn()
    render(<MyDay tasks={[task({ myDayAt: today })]} today={today} onQuickAdd={vi.fn()} onToggle={onToggle} />)
    await userEvent.click(screen.getByRole('checkbox'))
    expect(onToggle).toHaveBeenCalledWith('t1')
  })

  it('checks a completed task', () => {
    render(
      <MyDay
        tasks={[task({ myDayAt: today, isDone: true })]}
        today={today}
        onQuickAdd={vi.fn()}
        onToggle={vi.fn()}
      />,
    )
    expect(screen.getByRole('checkbox')).toBeChecked()
  })

  it('calls onQuickAdd with the trimmed title', async () => {
    const onQuickAdd = vi.fn()
    render(<MyDay tasks={[]} today={today} onQuickAdd={onQuickAdd} onToggle={vi.fn()} />)
    await userEvent.type(screen.getByLabelText(/việc hôm nay/i), '  Học PBL  ')
    await userEvent.click(screen.getByRole('button', { name: /thêm/i }))
    expect(onQuickAdd).toHaveBeenCalledWith('Học PBL')
  })

  it('does not add an empty title', async () => {
    const onQuickAdd = vi.fn()
    render(<MyDay tasks={[]} today={today} onQuickAdd={onQuickAdd} onToggle={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /thêm/i }))
    expect(onQuickAdd).not.toHaveBeenCalled()
  })

  it('shows remaining count', () => {
    render(
      <MyDay
        tasks={[task({ id: 'a', myDayAt: today }), task({ id: 'b', myDayAt: today, isDone: true })]}
        today={today}
        onQuickAdd={vi.fn()}
        onToggle={vi.fn()}
      />,
    )
    expect(screen.getByTestId('myday-remaining')).toHaveTextContent('1')
  })
})
