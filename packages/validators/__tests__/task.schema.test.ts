import { describe, it, expect } from 'vitest'
import { TaskSchema, EisenhowerEnum } from '../src/task.schema'

describe('TaskSchema', () => {
  it('parses valid task', () => {
    const result = TaskSchema.safeParse({
      title: 'Test task',
      eisenhowerQuadrant: 'A',
      isDone: false,
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid quadrant', () => {
    const result = TaskSchema.safeParse({
      title: 'Test task',
      eisenhowerQuadrant: 'X',
    })
    expect(result.success).toBe(false)
  })

  it('has correct enum values', () => {
    expect(EisenhowerEnum).toEqual(['A', 'B', 'C', 'D'])
  })
})
