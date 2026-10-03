import { z } from 'zod'

export const createReminderSchema = z.object({
  title: z.string().trim().min(1, 'Tiêu đề nhắc nhở là bắt buộc').max(140),
  dueAt: z.coerce.date(),
  repeat: z.enum(['none', 'daily', 'weekly']).default('none'),
})
