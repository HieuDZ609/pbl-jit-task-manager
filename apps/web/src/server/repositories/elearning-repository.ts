import type { ElearningItemInput, ElearningItemType } from '@/services/elearning/types'

export type ElearningItem = ElearningItemInput & {
  id: string
  importedAt: Date
}

export interface ElearningRepository {
  save(items: ElearningItemInput[]): Promise<ElearningItem[]>
  list(): Promise<ElearningItem[]>
  listByType(type: ElearningItemType): Promise<ElearningItem[]>
  count(): Promise<number>
}
