import { z } from 'zod'

export const FolderNameSchema = z
  .string()
  .trim()
  .min(1, 'Tên là bắt buộc')
  .max(100, 'Tên tối đa 100 ký tự')

export const IdSchema = z.string().uuid()

export const CreateFolderSchema = z.object({ name: FolderNameSchema })
export const CreateListSchema = z.object({
  name: FolderNameSchema,
  folderId: z.string().uuid().nullish(),
})
export const RenameSchema = z.object({
  id: z.string().uuid(),
  name: FolderNameSchema,
})
