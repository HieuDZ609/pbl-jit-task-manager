import { z } from 'zod'

export const EisenhowerEnum = ['A', 'B', 'C', 'D'] as const

export const TaskSchema = z.object({
  title: z.string().min(1),
  content: z.string().optional(),
  eisenhowerQuadrant: z.enum(EisenhowerEnum).optional(),
  isDone: z.boolean().default(false),
  dueAt: z.date().optional(),
  startAt: z.date().optional(),
  remindAt: z.date().optional(),
})

export const TaskInsertSchema = TaskSchema
export const TaskSelectSchema = TaskSchema.extend({
  id: z.string().uuid(),
})

export type Task = z.infer<typeof TaskSchema>
export type TaskInsert = z.infer<typeof TaskInsertSchema>
export type TaskSelect = z.infer<typeof TaskSelectSchema>
