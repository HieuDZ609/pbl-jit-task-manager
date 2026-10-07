import { describe, it, expect, vi } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
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

describe('CalendarView navigation', () => {
  const nav = () => render(<CalendarView initialTasks={tasks} day={day} onBlock={vi.fn()} />)
  const click = (name: string) =>
    fireEvent.click(screen.getByRole('button', { name: new RegExp(name, 'i') }))

  it('hiển thị nhãn ngày, tuần, tháng cho từng chế độ', () => {
    nav()
    expect(screen.getByText('Thứ Bảy, 03/10/2026')).toBeInTheDocument()
    click('tuần')
    expect(screen.getByText('28/09/2026 — 04/10/2026')).toBeInTheDocument()
    click('tháng')
    expect(screen.getByText('Tháng 10, 2026')).toBeInTheDocument()
  })

  it('điều hướng sau/trước theo từng chế độ', () => {
    nav()
    click('xem sau') // ngày +1
    expect(screen.getByText('Chủ Nhật, 04/10/2026')).toBeInTheDocument()
    click('xem trước')
    expect(screen.getByText('Thứ Bảy, 03/10/2026')).toBeInTheDocument()
    click('tuần')
    click('xem sau')
    expect(screen.getByText('05/10/2026 — 11/10/2026')).toBeInTheDocument()
    click('tháng')
    click('xem trước')
    expect(screen.getByText('Tháng 9, 2026')).toBeInTheDocument()
  })

  it('click một ngày trong lưới tháng chuyển sang day view ở đúng ngày', () => {
    nav()
    click('tháng')
    fireEvent.click(screen.getByTestId('month-day-2026-10-15'))
    expect(screen.getByRole('button', { name: /ngày/i }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByText('Thứ Năm, 15/10/2026')).toBeInTheDocument()
  })

  it('week view render lưới 7×24', () => {
    nav()
    click('tuần')
    expect(screen.getByTestId('week-col-2026-10-04')).toBeInTheDocument()
    const col = screen.getByTestId('week-col-2026-09-28')
    expect(col.querySelectorAll('[data-slot]')).toHaveLength(24)
  })

  it('drop trong week view gọi onBlock kèm đúng ngày của cột', () => {
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
    click('tuần')
    const slot = screen.getByTestId('week-slot-2026-10-01-14')
    act(() => {
      slot.dispatchEvent(new Event('drop', { bubbles: true }))
    })
    expect(onBlock).toHaveBeenCalledWith('1', 14, 60, expect.any(Date))
  })
})
