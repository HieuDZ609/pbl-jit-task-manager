import { describe, it, expect, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { CalendarView } from '../calendar-view'
import type { Task } from '@/features/tasks/types'

const day = new Date('2026-10-03T00:00:00')
const tasks: Task[] = [
  {
    id: '1',
    title: 'Học nhóm',
    isDone: false,
    startAt: new Date('2026-10-03T09:00:00'),
    dueAt: new Date('2026-10-03T10:00:00'),
  },
]

describe('CalendarView', () => {
  it('renders 24 hour rows', () => {
    render(<CalendarView initialTasks={tasks} day={day} />)
    expect(screen.getByText('00:00')).toBeInTheDocument()
    expect(screen.getByText('23:00')).toBeInTheDocument()
  })

  it('renders the blocked task', () => {
    render(<CalendarView initialTasks={tasks} day={day} />)
    expect(screen.getByText(/Học nhóm/)).toBeInTheDocument()
  })

  it('calls onBlock when dropping a task on a slot', () => {
    const onBlock = vi.fn().mockResolvedValue(undefined)
    render(
      <CalendarView
        initialTasks={tasks}
        day={day}
        onBlock={onBlock}
        draggableTaskId="1"
        durationMinutes={60}
      />,
    )
    const slot = screen.getByTestId('slot-14')
    act(() => {
      slot.dispatchEvent(new Event('drop', { bubbles: true }))
    })
    expect(onBlock).toHaveBeenCalledWith('1', 14, 60)
  })

  it('does not call onBlock without a dragged task', () => {
    const onBlock = vi.fn().mockResolvedValue(undefined)
    render(<CalendarView initialTasks={tasks} day={day} onBlock={onBlock} durationMinutes={60} />)
    const slot = screen.getByTestId('slot-14')
    act(() => {
      slot.dispatchEvent(new Event('drop', { bubbles: true }))
    })
    expect(onBlock).not.toHaveBeenCalled()
  })

  it('renders a day/month/week view switcher', () => {
    render(<CalendarView initialTasks={tasks} day={day} />)
    expect(screen.getByRole('button', { name: /ngày/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /tuần/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /tháng/i })).toBeInTheDocument()
  })
})
