import { randomUUID } from 'node:crypto'
import type { ElearningItemInput, ElearningItemType } from '@/services/elearning/types'
import type { ElearningItem, ElearningRepository } from './elearning-repository'

export class InMemoryElearningRepository implements ElearningRepository {
  private rows: ElearningItem[] = []

  async save(items: ElearningItemInput[]): Promise<ElearningItem[]> {
    const saved = items.map((item) => ({ id: randomUUID(), importedAt: new Date(), ...item }))
    this.rows.push(...saved)
    return saved
  }

  async list(): Promise<ElearningItem[]> {
    return [...this.rows]
  }

  async listByType(type: ElearningItemType): Promise<ElearningItem[]> {
    return this.rows.filter((r) => r.type === type)
  }

  async count(): Promise<number> {
    return this.rows.length
  }
}
