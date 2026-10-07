import { and, asc, count, eq } from 'drizzle-orm'

import { checklists, tasks, type AppDb } from '@pbl/db'

import type { ChecklistItem, ChecklistRepository } from './checklist-repository'

/**
 * Adapter Drizzle cho ChecklistRepository. `userId` gắn vào constructor để mọi
 * truy vấn scope theo user bắt buộc (xem `DrizzleTaskRepository`).
 */
export class DrizzleChecklistRepository implements ChecklistRepository {
  constructor(
    private readonly db: AppDb,
    private readonly userId: string,
  ) {}

  /**
   * Chặn `task_id` trỏ sang task của user khác.
   *
   * `addChecklistItem` đã kiểm `findById` trước khi gọi, nhưng `task_id` chỉ có FK
   * theo `id` và `create` là đường vào chung — kiểm ở adapter để không phụ thuộc
   * vào việc mọi action đều nhớ kiểm (đó chính là chỗ hởng đã gặp ở
   * `logFocusSession`).
   */
  async create(taskId: string, title: string): Promise<ChecklistItem> {
    await this.assertTask(taskId)

    const [row] = await this.db
      .insert(checklists)
      .values({ userId: this.userId, taskId, title, sortOrder: await this.nextSortOrder() })
      .returning()

    return toItem(row)
  }

  async findById(id: string): Promise<ChecklistItem | null> {
    const [row] = await this.db
      .select()
      .from(checklists)
      .where(this.scoped(id))
      .limit(1)

    return row ? toItem(row) : null
  }

  async listByTask(taskId: string): Promise<ChecklistItem[]> {
    const rows = await this.db
      .select()
      .from(checklists)
      .where(and(eq(checklists.userId, this.userId), eq(checklists.taskId, taskId)))
      .orderBy(asc(checklists.sortOrder))

    return rows.map(toItem)
  }

  async setDone(id: string, isDone: boolean): Promise<ChecklistItem> {
    const [row] = await this.db
      .update(checklists)
      .set({ isDone })
      .where(this.scoped(id))
      .returning()

    return toItem(requireRow(row, id))
  }

  async remove(id: string): Promise<void> {
    // In-memory ném lỗi khi id không tồn tại, nên phải kiểm trước khi xoá:
    // `delete` không trả row nên không suy ra được từ kết quả.
    if ((await this.findById(id)) === null) {
      throw new Error(`Checklist item not found: ${id}`)
    }
    await this.db.delete(checklists).where(this.scoped(id))
  }

  /** Task của user này — chặn `task_id` trỏ sang task của người khác. */
  private async assertTask(id: string): Promise<void> {
    const [row] = await this.db
      .select({ id: tasks.id })
      .from(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, this.userId)))
      .limit(1)

    if (!row) throw new Error(`Task not found: ${id}`)
  }

  private scoped(id: string) {
    return and(eq(checklists.id, id), eq(checklists.userId, this.userId))
  }

  private async nextSortOrder(): Promise<number> {
    const [row] = await this.db
      .select({ value: count() })
      .from(checklists)
      .where(eq(checklists.userId, this.userId))

    return row?.value ?? 0
  }
}

function toItem(row: typeof checklists.$inferSelect): ChecklistItem {
  return {
    id: row.id,
    // Schema cho phép `task_id` null còn domain type thì không. Mọi đường ghi
    // hiện tại đều truyền taskId, nên fallback này không xảy ra; giữ `?? ''` thay
    // vì ép assert để lộ sai lệch nếu schema và domain lệch nhau.
    taskId: row.taskId ?? '',
    title: row.title,
    isDone: row.isDone ?? false,
    sortOrder: row.sortOrder ?? 0,
  }
}

/** Message phải khớp in-memory để UI không đổi hành vi khi đổi adapter. */
function requireRow(row: typeof checklists.$inferSelect | undefined, id: string): NonNullable<typeof row> {
  if (!row) throw new Error(`Checklist item not found: ${id}`)
  return row
}
