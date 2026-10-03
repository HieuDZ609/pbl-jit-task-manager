import { describe, it, expect } from 'vitest'
import { QUADRANTS, quadrantMeta, groupByQuadrant, moveTaskToQuadrant } from '../quadrants'
import type { Task } from '@/features/tasks/types'

function t(id: string, quadrant: Task['eisenhowerQuadrant']): Task {
  return { id, title: id, isDone: false, eisenhowerQuadrant: quadrant, deletedAt: null }
}

describe('quadrants', () => {
  it('has exactly 4 quadrants A-D', () => {
    expect(QUADRANTS).toEqual(['A', 'B', 'C', 'D'])
  })

  it('provides Vietnamese labels for each quadrant', () => {
    expect(quadrantMeta('A').label).toBe('Khẩn cấp & Quan trọng')
    expect(quadrantMeta('B').label).toBe('Quan trọng, không khẩn cấp')
    expect(quadrantMeta('C').label).toBe('Khẩn cấp, không quan trọng')
    expect(quadrantMeta('D').label).toBe('Không khẩn cấp & không quan trọng')
  })

  it('groups tasks by quadrant', () => {
    const tasks = [t('1', 'A'), t('2', 'A'), t('3', 'B'), t('4', null)]
    const grouped = groupByQuadrant(tasks)
    expect(grouped.A.map((x) => x.id)).toEqual(['1', '2'])
    expect(grouped.B.map((x) => x.id)).toEqual(['3'])
    expect(grouped.C).toEqual([])
    expect(grouped.D).toEqual([])
  })

  it('moves a task to a new quadrant', () => {
    const tasks = [t('1', 'A')]
    const moved = moveTaskToQuadrant(tasks, '1', 'B')
    expect(moved[0].eisenhowerQuadrant).toBe('B')
  })

  it('leaves other tasks untouched when moving', () => {
    const tasks = [t('1', 'A'), t('2', 'C')]
    const moved = moveTaskToQuadrant(tasks, '1', 'D')
    expect(moved[1].eisenhowerQuadrant).toBe('C')
  })

  it('is a no-op when moving a task to its current quadrant', () => {
    const tasks = [t('1', 'A')]
    const moved = moveTaskToQuadrant(tasks, '1', 'A')
    expect(moved).toBe(tasks)
  })

  it('ignores unknown task id', () => {
    const tasks = [t('1', 'A')]
    expect(moveTaskToQuadrant(tasks, 'zz', 'B')).toBe(tasks)
  })
})
