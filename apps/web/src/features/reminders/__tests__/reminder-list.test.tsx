import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReminderList } from '../reminder-list'
import type { Reminder } from '../../../server/repositories/reminder-repository'

const now = new Date('2026-10-03T09:00:00')

function reminder(overrides: Partial<Reminder> = {}): Reminder {
  return {
    id: 'r1',
    title: 'Gọi mẹ',
    dueAt: new Date('2026-10-03T10:00:00'),
    repeat: 'none',
    done: false,
    notifiedAt: null,
    ...overrides,
  }
}

describe('ReminderList', () => {
  it('renders the reminder title', () => {
    render(<ReminderList reminders={[reminder()]} now={now} />)
    expect(screen.getByText('Gọi mẹ')).toBeInTheDocument()
  })

  it('shows a status label', () => {
    render(<ReminderList reminders={[reminder()]} now={now} />)
    expect(screen.getByText(/sắp đến hạn/i)).toBeInTheDocument()
  })

  it('marks an overdue reminder', () => {
    render(
      <ReminderList reminders={[reminder({ dueAt: new Date('2026-10-03T08:00:00') })]} now={now} />,
    )
    expect(screen.getByText(/quá hạn/i)).toBeInTheDocument()
  })

  it('sorts the earliest reminder first', () => {
    render(
      <ReminderList
        reminders={[
          reminder({ id: 'late', title: 'Muộn', dueAt: new Date('2026-10-03T18:00:00') }),
          reminder({ id: 'early', title: 'Sớm', dueAt: new Date('2026-10-03T09:30:00') }),
        ]}
        now={now}
      />,
    )
    const items = screen.getAllByTestId(/reminder-item-/)
    expect(items[0]).toHaveTextContent('Sớm')
  })

  it('calls onDone when completing', async () => {
    const onDone = vi.fn()
    render(<ReminderList reminders={[reminder()]} now={now} onDone={onDone} />)
    await userEvent.click(screen.getByRole('button', { name: /hoàn thành/i }))
    expect(onDone).toHaveBeenCalledWith('r1')
  })

  it('calls onSnooze with 10 minutes by default', async () => {
    const onSnooze = vi.fn()
    render(<ReminderList reminders={[reminder()]} now={now} onSnooze={onSnooze} />)
    await userEvent.click(screen.getByRole('button', { name: /bỏ qua 10/i }))
    expect(onSnooze).toHaveBeenCalledWith('r1', 10)
  })

  it('calls onSnooze with 60 minutes for the long option', async () => {
    const onSnooze = vi.fn()
    render(<ReminderList reminders={[reminder()]} now={now} onSnooze={onSnooze} />)
    await userEvent.click(screen.getByRole('button', { name: /bỏ qua 60/i }))
    expect(onSnooze).toHaveBeenCalledWith('r1', 60)
  })

  it('hides actions for a completed reminder', () => {
    render(<ReminderList reminders={[reminder({ done: true })]} now={now} onDone={vi.fn()} />)
    expect(screen.queryByRole('button', { name: /hoàn thành/i })).not.toBeInTheDocument()
  })

  it('shows an empty state', () => {
    render(<ReminderList reminders={[]} now={now} />)
    expect(screen.getByText(/chưa có nhắc nhở/i)).toBeInTheDocument()
  })
})
