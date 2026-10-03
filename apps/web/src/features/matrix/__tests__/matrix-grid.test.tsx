import { describe, it, expect, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { MatrixGrid } from '../matrix-grid'
import type { Task } from '@/features/tasks/types'

const tasks: Task[] = [
  { id: '1', title: 'Nộp đồ án', isDone: false, eisenhowerQuadrant: 'A', deletedAt: null },
  { id: '2', title: 'Ôn thi', isDone: false, eisenhowerQuadrant: 'B', deletedAt: null },
]

function dragAndDrop(taskId: string, quadrant: string) {
  const card = screen.getByTestId(`task-${taskId}`)
  const target = screen.getByTestId(`quadrant-${quadrant}`)
  act(() => {
    card.dispatchEvent(new Event('dragstart', { bubbles: true }))
  })
  act(() => {
    target.dispatchEvent(new Event('drop', { bubbles: true }))
  })
}

describe('MatrixGrid', () => {
  it('renders all 4 quadrant headings', () => {
    render(<MatrixGrid initialTasks={tasks} />)
    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.getByText('B')).toBeInTheDocument()
    expect(screen.getByText('C')).toBeInTheDocument()
    expect(screen.getByText('D')).toBeInTheDocument()
  })

  it('renders tasks inside the correct quadrant', () => {
    render(<MatrixGrid initialTasks={tasks} />)
    const qA = screen.getByTestId('quadrant-A')
    expect(qA).toHaveTextContent('Nộp đồ án')
    expect(qA).not.toHaveTextContent('Ôn thi')
  })

  it('calls onMove when a card is dropped on another quadrant', () => {
    const onMove = vi.fn().mockResolvedValue(undefined)
    render(<MatrixGrid initialTasks={tasks} onMove={onMove} />)
    dragAndDrop('1', 'B')
    expect(onMove).toHaveBeenCalledWith('1', 'B')
  })

  it('does not call onMove when dropped on the same quadrant', () => {
    const onMove = vi.fn().mockResolvedValue(undefined)
    render(<MatrixGrid initialTasks={tasks} onMove={onMove} />)
    dragAndDrop('1', 'A')
    expect(onMove).not.toHaveBeenCalled()
  })

  it('moves the card visually after drop', () => {
    render(<MatrixGrid initialTasks={tasks} />)
    dragAndDrop('1', 'C')
    expect(screen.getByTestId('quadrant-C')).toHaveTextContent('Nộp đồ án')
    expect(screen.getByTestId('quadrant-A')).not.toHaveTextContent('Nộp đồ án')
  })

  it('shows empty hint in empty quadrant', () => {
    render(<MatrixGrid initialTasks={tasks} />)
    expect(screen.getByTestId('quadrant-D')).toHaveTextContent(/Chưa có công việc/)
  })
})
