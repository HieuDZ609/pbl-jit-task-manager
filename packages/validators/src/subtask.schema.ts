import { z } from 'zod'

import { IdSchema } from './folder-list.schema'

export const SubtaskTitleSchema = z
  .string()
  .trim()
  .min(1, 'Tiêu đề là bắt buộc')
  .max(200, 'Tiêu đề tối đa 200 ký tự')

export const CreateSubtaskSchema = z.object({
  parentId: IdSchema,
  title: SubtaskTitleSchema,
})
