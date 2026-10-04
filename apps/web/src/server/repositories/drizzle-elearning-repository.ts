import { and, asc, eq } from 'drizzle-orm'

import { elearningItems, type AppDb } from '@pbl/db'

import type { ElearningItem, ElearningRepository } from './elearning-repository'
import type { ElearningItemInput, ElearningItemType } from '@/services/elearning/types'

type ElearningRow = typeof elearningItems.$inferSelect

/**
 * Adapter Drizzle cho ElearningRepository. `userId` gắn vào constructor nên mọi
 * truy vấn scope theo user không thể quên (xem `DrizzleTaskRepository`).
 *
 * `dueAt` giữ nguyên dạng chuỗi `YYYY-MM-DD`: cột `due_at` là `text` vì deadline
 * e-learning là *ngày*, không có giờ. Lưu `timestamp` sẽ bắt phải chọn múi giờ ở cả
 * chiều ghi và chiều đọc, và chỉ cần lệch một ngày là sai deadline.
 *
 * `save` **không** dedupe: việc loại trùng theo (source, externalId) thuộc tầng
 * service, giữ nguyên như `InMemoryElearningRepository` để hợp đồng hai bên giống
 * nhau. Dedupe ở tầng repo sẽ khiến `save` trả về ít hơn số item đầu vào — đó là
 * một hợp đồng khác, phải đổi cả hai cùng lúc.
 */
export class DrizzleElearningRepository implements ElearningRepository {
  constructor(
    private readonly db: AppDb,
    private readonly userId: string,
  ) {}

  async save(items: ElearningItemInput[]): Promise<ElearningItem[]> {
    if (items.length === 0) return []

    const now = new Date()
    const rows = await this.db
      .insert(elearningItems)
      .values(
        items.map((item) => ({
          userId: this.userId,
          source: item.source,
          externalId: item.externalId,
          course: item.course,
          title: item.title,
          url: item.url,
          dueAt: item.dueAt,
          type: item.type,
        })),
      )
      .returning()

    // `returning()` không đảm bảo cùng thứ tự với input, nên ghép lại theo `title`
    // để thứ tự trả về khớp hợp đồng in-memory.
    const byTitle = new Map(rows.map((row) => [row.title, toItem(row, now)]))
    return items.map((item) => byTitle.get(item.title) ?? toItem(rows[0], now))
  }

  async list(): Promise<ElearningItem[]> {
    const rows = await this.db
      .select()
      .from(elearningItems)
      .where(eq(elearningItems.userId, this.userId))
      .orderBy(asc(elearningItems.createdAt))

    return rows.map((row) => toItem(row, row.createdAt ?? new Date()))
  }

  async listByType(type: ElearningItemType): Promise<ElearningItem[]> {
    const rows = await this.db
      .select()
      .from(elearningItems)
      .where(and(eq(elearningItems.userId, this.userId), eq(elearningItems.type, type)))
      .orderBy(asc(elearningItems.createdAt))

    return rows.map((row) => toItem(row, row.createdAt ?? new Date()))
  }

  async count(): Promise<number> {
    const rows = await this.db
      .select({ id: elearningItems.id })
      .from(elearningItems)
      .where(eq(elearningItems.userId, this.userId))

    return rows.length
  }
}

function toItem(row: ElearningRow, importedAt: Date): ElearningItem {
  return {
    id: row.id,
    course: row.course ?? '',
    title: row.title,
    dueAt: row.dueAt,
    url: row.url ?? null,
    type: (row.type ?? 'task') as ElearningItemType,
    source: (row.source ?? 'manual') as ElearningItem['source'],
    externalId: row.externalId ?? null,
    importedAt,
  }
}
