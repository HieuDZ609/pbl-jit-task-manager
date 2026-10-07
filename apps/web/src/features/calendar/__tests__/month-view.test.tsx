import { describe, it, expect, vi } from 'vitest'
import { render, screen, within, fireEvent } from '@testing-library/react'
import { MonthView } from '../month-view'
import type { Task } from '@/features/tasks/types'

const october = new Date('2026-10-15T00:00:00')
const tasks: Task[] = [
  {
    id: '1',
    title: 'Nộp bài lớn',
    isDone: false,
    startAt: new Date('2026-10-01T09:00:00'),
    dueAt: new Date('2026-10-01T10:00:00'),
  },
]

describe('MonthView', () => {
  it('render lưới 6×7 ngày', () => {
    render(<MonthView tasks={tasks} month={october} />)
    const grid = screen.getByTestId('month-grid')
    expect(grid.querySelectorAll('[data-month-cell]')).toHaveLength(42)
  })

  it('đặt chip task đúng ngày', () => {
    render(<MonthView tasks={tasks} month={october} />)
    const first = screen.getByTestId('month-day-2026-10-01')
    expect(within(first).getByText(/Nộp bài lớn/)).toBeInTheDocument()
    expect(within(screen.getByTestId('month-day-2026-10-02')).queryByText(/Nộp bài lớn/)).not.toBeInTheDocument()
  })

  it('đánh dấu ngày ngoài tháng so với ngày trong tháng', () => {
    render(<MonthView tasks={tasks} month={october} />)
    const prev = screen.getByTestId('month-day-2026-09-30')
    const inMonth = screen.getByTestId('month-day-2026-10-01')
    expect(prev.getAttribute('data-outside')).toBe('true')
    expect(inMonth.getAttribute('data-outside')).toBeNull()
  })

  it('click một ngày gọi onSelectDay với đúng ngày', () => {
    const onSelectDay = vi.fn()
    render(<MonthView tasks={tasks} month={october} onSelectDay={onSelectDay} />)
    fireEvent.click(screen.getByTestId('month-day-2026-10-15'))
    expect(onSelectDay).toHaveBeenCalledTimes(1)
    const day = onSelectDay.mock.calls[0][0] as Date
    expect(day.getFullYear()).toBe(2026)
    expect(day.getMonth()).toBe(9)
    expect(day.getDate()).toBe(15)
  })
})