import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Heatmap } from '../heatmap'
import { buildHeatmap, toDateKey } from '../streak'

const today = new Date('2026-10-03T09:00:00')

describe('Heatmap', () => {
  it('renders one cell per day', () => {
    const cells = buildHeatmap([], 14, today)
    render(<Heatmap cells={cells} />)
    expect(screen.getAllByTestId(/heat-cell-/)).toHaveLength(14)
  })

  it('labels each cell with its date', () => {
    const cells = buildHeatmap([], 7, today)
    render(<Heatmap cells={cells} />)
    expect(screen.getByTestId(`heat-cell-${toDateKey(today)}`)).toBeInTheDocument()
  })

  it('exposes the log count in the accessible title', () => {
    const cells = buildHeatmap(['2026-10-03'], 7, today)
    render(<Heatmap cells={cells} />)
    expect(screen.getByTitle(/1 lần/i)).toBeInTheDocument()
  })

  it('shows a legend', () => {
    render(<Heatmap cells={buildHeatmap([], 7, today)} />)
    expect(screen.getByText(/ít/i)).toBeInTheDocument()
    expect(screen.getByText(/nhiều/i)).toBeInTheDocument()
  })
})
