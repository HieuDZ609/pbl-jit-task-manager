import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatsDashboard } from '../stats-dashboard'
import { computeStats } from '../stats'

const now = new Date('2026-10-03T09:00:00')

const empty = { tasks: [], focusSessions: [], habits: [], habitLogs: {} }

describe('StatsDashboard', () => {
  it('shows completed today', () => {
    render(<StatsDashboard stats={computeStats(empty, now)} />)
    expect(screen.getByTestId('stat-completedToday')).toBeInTheDocument()
  })

  it('shows overdue count', () => {
    render(<StatsDashboard stats={computeStats(empty, now)} />)
    expect(screen.getByTestId('stat-overdue')).toBeInTheDocument()
  })

  it('shows focus minutes', () => {
    render(<StatsDashboard stats={computeStats(empty, now)} />)
    expect(screen.getByTestId('stat-focusMinutesToday')).toBeInTheDocument()
  })

  it('shows habit completion rate', () => {
    render(<StatsDashboard stats={computeStats(empty, now)} />)
    expect(screen.getByTestId('stat-habitCompletionRate')).toBeInTheDocument()
  })

  it('renders all four quadrants', () => {
    render(<StatsDashboard stats={computeStats(empty, now)} />)
    for (const q of ['A', 'B', 'C', 'D']) {
      expect(screen.getByTestId(`quadrant-${q}`)).toBeInTheDocument()
    }
  })

  it('renders zeros on an empty dataset', () => {
    render(<StatsDashboard stats={computeStats(empty, now)} />)
    expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(4)
  })

  it('displays a real number', () => {
    const stats = computeStats(
      { ...empty, tasks: [{ id: 'a', title: 'A', isDone: true, doneAt: new Date('2026-10-03T08:00:00') } as never] },
      now,
    )
    render(<StatsDashboard stats={stats} />)
    expect(screen.getByTestId('stat-completedToday')).toHaveTextContent('1')
  })
})
