import { z } from 'zod'

import { IdSchema } from './folder-list.schema'

export const ChecklistItemTitleSchema = z
  .string()
  .trim()
  .min(1, 'Tiêu đề là bắt buộc')
  .max(100, 'Tiêu đề tối đa 100 ký tự')

export const CreateChecklistItemSchema = z.object({
  taskId: IdSchema,
  title: ChecklistItemTitleSchema,
})

export const SetChecklistItemDoneSchema = z.object({
  id: IdSchema,
  isDone: z.boolean(),
})
