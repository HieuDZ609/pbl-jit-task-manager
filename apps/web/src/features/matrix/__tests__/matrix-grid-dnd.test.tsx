import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MatrixGrid } from '../matrix-grid'
import type { Task } from '@/features/tasks/types'

function task(overrides: Partial<Task> = {}): Task {
  return {
    id: 't1',
    title: 'Viết báo cáo',
    content: null,
    eisenhowerQuadrant: 'A',
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

function drag(taskId: string, target: string) {
  fireEvent.dragStart(screen.getByTestId(`task-${taskId}`))
  fireEvent.dragOver(screen.getByTestId(`quadrant-${target}`))
  fireEvent.drop(screen.getByTestId(`quadrant-${target}`))
}

describe('MatrixGrid drag and drop', () => {
  it('moves a dragged task to the target quadrant', () => {
    render(<MatrixGrid initialTasks={[task()]} />)
    drag('t1', 'C')
    expect(screen.getByTestId('quadrant-C')).toHaveTextContent('Viết báo cáo')
  })

  it('calls onMove with the task id and target', () => {
    const onMove = vi.fn()
    render(<MatrixGrid initialTasks={[task()]} onMove={onMove} />)
    drag('t1', 'D')
    expect(onMove).toHaveBeenCalledWith('t1', 'D')
  })

  it('does not call onMove when dropped on the same quadrant', () => {
    const onMove = vi.fn()
    render(<MatrixGrid initialTasks={[task({ eisenhowerQuadrant: 'A' })]} onMove={onMove} />)
    drag('t1', 'A')
    expect(onMove).not.toHaveBeenCalled()
  })

  it('does not crash when dropped without a drag start', () => {
    const onMove = vi.fn()
    render(<MatrixGrid initialTasks={[task()]} onMove={onMove} />)
    fireEvent.drop(screen.getByTestId('quadrant-B'))
    expect(onMove).not.toHaveBeenCalled()
  })

  it('does not crash when onMove is absent', () => {
    render(<MatrixGrid initialTasks={[task()]} />)
    drag('t1', 'B')
    expect(screen.getByTestId('quadrant-B')).toHaveTextContent('Viết báo cáo')
  })

  it('clears the drag-over highlight after drop', () => {
    render(<MatrixGrid initialTasks={[task()]} />)
    fireEvent.dragStart(screen.getByTestId('task-t1'))
    fireEvent.dragOver(screen.getByTestId('quadrant-C'))
    fireEvent.drop(screen.getByTestId('quadrant-C'))
    fireEvent.dragLeave(screen.getByTestId('quadrant-C'))
    expect(screen.getByTestId('quadrant-C')).toBeInTheDocument()
  })

  it('clears the highlight on drag end', () => {
    render(<MatrixGrid initialTasks={[task()]} />)
    fireEvent.dragStart(screen.getByTestId('task-t1'))
    fireEvent.dragOver(screen.getByTestId('quadrant-C'))
    fireEvent.dragEnd(screen.getByTestId('task-t1'))
    drag('t1', 'C')
    expect(screen.getByTestId('quadrant-C')).toHaveTextContent('Viết báo cáo')
  })

  it('renders all four quadrants', () => {
    render(<MatrixGrid initialTasks={[task()]} />)
    for (const q of ['A', 'B', 'C', 'D']) {
      expect(screen.getByTestId(`quadrant-${q}`)).toBeInTheDocument()
    }
  })

  it('renders an empty state with no tasks', () => {
    render(<MatrixGrid initialTasks={[]} />)
    expect(screen.getByText(/chưa có việc nào/i)).toBeInTheDocument()
  })
})
