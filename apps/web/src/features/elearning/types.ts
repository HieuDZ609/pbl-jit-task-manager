import type { ElearningItemInput, ElearningItemType } from '@/services/elearning/types'

export type ElearningItem = ElearningItemInput & {
  id: string
  importedAt: Date
}
