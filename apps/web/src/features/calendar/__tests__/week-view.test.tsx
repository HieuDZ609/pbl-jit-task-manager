import { describe, it, expect, vi } from 'vitest'
import { render, screen, within, act } from '@testing-library/react'
import { WeekView } from '../week-view'
import type { Task } from '@/features/tasks/types'

const monday = new Date('2026-09-28T00:00:00')
const tasks: Task[] = [
  {
    id: '1',
    title: 'Học nhóm',
    isDone: false,
    startAt: new Date('2026-10-01T09:00:00'),
    dueAt: new Date('2026-10-01T10:00:00'),
  },
]

describe('WeekView', () => {
  it('render 7 cột ngày từ thứ Hai đến Chủ Nhật', () => {
    render(<WeekView tasks={tasks} weekStart={monday} />)
    for (const key of [
      '2026-09-28',
      '2026-09-29',
      '2026-09-30',
      '2026-10-01',
      '2026-10-02',
      '2026-10-03',
      '2026-10-04',
    ]) {
      expect(screen.getByTestId(`week-col-${key}`)).toBeInTheDocument()
    }
    expect(screen.getByText('T2')).toBeInTheDocument()
    expect(screen.getByText('CN')).toBeInTheDocument()
  })

  it('render 24 slot giờ ở mỗi cột', () => {
    render(<WeekView tasks={tasks} weekStart={monday} />)
    const col = screen.getByTestId('week-col-2026-09-28')
    expect(col.querySelectorAll('[data-slot]')).toHaveLength(24)
  })

  it('đặt task vào đúng ngày và đúng giờ', () => {
    render(<WeekView tasks={tasks} weekStart={monday} />)
    const slot = screen.getByTestId('week-slot-2026-10-01-9')
    expect(within(slot).getByText(/Học nhóm/)).toBeInTheDocument()
    expect(within(screen.getByTestId('week-slot-2026-10-01-10')).queryByText(/Học nhóm/)).not.toBeInTheDocument()
    expect(within(screen.getByTestId('week-slot-2026-10-02-9')).queryByText(/Học nhóm/)).not.toBeInTheDocument()
  })

  it('drop task vào slot của ngày khác gọi onBlock với đúng ngày và giờ', () => {
    const onBlock = vi.fn().mockResolvedValue(undefined)
    render(<WeekView tasks={tasks} weekStart={monday} onBlock={onBlock} draggableTaskId="1" durationMinutes={30} />)
    const slot = screen.getByTestId('week-slot-2026-10-02-14')
    act(() => {
      slot.dispatchEvent(new Event('drop', { bubbles: true }))
    })
    expect(onBlock).toHaveBeenCalledWith('1', 14, 30, expect.any(Date))
    const [, , , day] = onBlock.mock.calls[0]
    expect(`${day.getFullYear()}-${day.getMonth() + 1}-${day.getDate()}`).toBe('2026-10-2')
  })

  it('không gọi onBlock khi không có task đang kéo', () => {
    const onBlock = vi.fn().mockResolvedValue(undefined)
    render(<WeekView tasks={tasks} weekStart={monday} onBlock={onBlock} />)
    const slot = screen.getByTestId('week-slot-2026-10-02-14')
    act(() => {
      slot.dispatchEvent(new Event('drop', { bubbles: true }))
    })
    expect(onBlock).not.toHaveBeenCalled()
  })
})