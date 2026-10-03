import type { ElearningItemInput, ElearningItemType } from '@/services/elearning/types'
import type { ElearningItem } from '@/features/elearning/types'

export type { ElearningItem }

export interface ElearningRepository {
  save(items: ElearningItemInput[]): Promise<ElearningItem[]>
  list(): Promise<ElearningItem[]>
  listByType(type: ElearningItemType): Promise<ElearningItem[]>
  count(): Promise<number>
}
