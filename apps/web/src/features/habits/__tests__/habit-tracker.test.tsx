import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HabitTracker } from '../habit-tracker'
import type { Habit, HabitLog } from '../../../server/repositories/habit-repository'

function habit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'h1',
    name: 'Uống nước',
    color: null,
    icon: null,
    frequency: 'daily',
    targetCount: 1,
    startDate: new Date('2026-10-01'),
    archived: false,
    ...overrides,
  }
}

const today = new Date('2026-10-03T09:00:00')

function log(date: string, count = 1): HabitLog {
  return { id: `${date}`, habitId: 'h1', date: new Date(`${date}T08:00:00`), count }
}

describe('HabitTracker', () => {
  it('renders the habit name', () => {
    render(<HabitTracker habits={[habit()]} logsByHabit={{ h1: [] }} today={today} />)
    expect(screen.getByText('Uống nước')).toBeInTheDocument()
  })

  it('shows the current streak', () => {
    render(
      <HabitTracker
        habits={[habit()]}
        logsByHabit={{ h1: [log('2026-10-01'), log('2026-10-02'), log('2026-10-03')] }}
        today={today}
      />,
    )
    expect(screen.getByTestId('streak-h1')).toHaveTextContent('3')
  })

  it('shows the longest streak', () => {
    render(
      <HabitTracker
        habits={[habit()]}
        logsByHabit={{ h1: [log('2026-10-01'), log('2026-10-02'), log('2026-10-03'), log('2026-09-01'), log('2026-09-02'), log('2026-09-03'), log('2026-09-04')] }}
        today={today}
      />,
    )
    expect(screen.getByTestId('longest-h1')).toHaveTextContent('4')
  })

  it('marks today as done when a log exists', () => {
    render(<HabitTracker habits={[habit()]} logsByHabit={{ h1: [log('2026-10-03')] }} today={today} />)
    expect(screen.getByRole('button', { name: /uống nước/i })).toHaveAttribute('aria-pressed', 'true')
  })

  it('calls onCheckIn with the habit id when not yet done', async () => {
    const onCheckIn = vi.fn()
    render(
      <HabitTracker habits={[habit()]} logsByHabit={{ h1: [] }} today={today} onCheckIn={onCheckIn} />,
    )
    await userEvent.click(screen.getByRole('button', { name: /uống nước/i }))
    expect(onCheckIn).toHaveBeenCalledWith('h1')
  })

  it('calls onUndo when already done today', async () => {
    const onUndo = vi.fn()
    render(
      <HabitTracker
        habits={[habit()]}
        logsByHabit={{ h1: [log('2026-10-03')] }}
        today={today}
        onUndo={onUndo}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: /uống nước/i }))
    expect(onUndo).toHaveBeenCalledWith('h1')
  })

  it('renders a heatmap per habit', () => {
    render(<HabitTracker habits={[habit()]} logsByHabit={{ h1: [log('2026-10-03')] }} today={today} heatmapDays={7} />)
    expect(screen.getAllByTestId(/heat-cell-/)).toHaveLength(7)
  })

  it('shows the target count for multi-count habits', () => {
    render(
      <HabitTracker
        habits={[habit({ targetCount: 8, name: 'Uống nước' })]}
        logsByHabit={{ h1: [log('2026-10-03', 3)] }}
        today={today}
      />,
    )
    expect(screen.getByTestId('progress-h1')).toHaveTextContent('3/8')
  })

  it('renders nothing but a message when there are no habits', () => {
    render(<HabitTracker habits={[]} logsByHabit={{}} today={today} />)
    expect(screen.getByText(/chưa có thói quen/i)).toBeInTheDocument()
  })

  it('renders multiple habits', () => {
    render(
      <HabitTracker
        habits={[habit(), habit({ id: 'h2', name: 'Tập gym' })]}
        logsByHabit={{ h1: [], h2: [] }}
        today={today}
      />,
    )
    expect(screen.getByText('Tập gym')).toBeInTheDocument()
  })
})
