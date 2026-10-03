import { z } from 'zod'

export const createHabitSchema = z.object({
  name: z.string().trim().min(1, 'Tên thói quen là bắt buộc').max(80),
  frequency: z.enum(['daily', 'weekly']).default('daily'),
  targetCount: z.number().int().min(1).max(100).default(1),
  color: z.string().nullable().optional(),
})

export const logHabitSchema = z.object({
  habitId: z.string().uuid(),
})
