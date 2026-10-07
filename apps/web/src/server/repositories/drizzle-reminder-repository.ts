import { and, asc, eq } from 'drizzle-orm'

import { reminders, type AppDb } from '@pbl/db'

import type { Reminder, ReminderRepository } from './reminder-repository'
import type { ReminderRepeat } from '@/features/reminders/reminder-logic'

type ReminderRow = typeof reminders.$inferSelect

/**
 * Adapter Drizzle cho ReminderRepository. `userId` gắn vào constructor nên mọi
 * truy vấn scope theo user không thể quên (xem `DrizzleTaskRepository`).
 *
 * Hai chỗ dễ đảo chiều, đã khoá lại ở đây:
 * - `done` (domain) là **chiều ngược** của `cancelled` (DB): reminder đã xong ⇔
 *   `cancelled = true`.
 * - `notifiedAt` (domain) là `firedAt` (DB).
 * Toàn bộ việc đọc chiều nào đều nằm trong `toReminder`/`fromDone`, không tải cột
 * ra ngoài.
 */
export class DrizzleReminderRepository implements ReminderRepository {
  constructor(
    private readonly db: AppDb,
    private readonly userId: string,
  ) {}

  async create(input: {
    title: string
    dueAt: Date
    repeat?: ReminderRepeat
  }): Promise<Reminder> {
    const [row] = await this.db
      .insert(reminders)
      .values({
        userId: this.userId,
        title: input.title,
        scheduledAt: input.dueAt,
        repeat: input.repeat ?? 'none',
      })
      .returning()

    return toReminder(requireRow(row))
  }

  async list(): Promise<Reminder[]> {
    const rows = await this.db
      .select()
      .from(reminders)
      .where(eq(reminders.userId, this.userId))
      .orderBy(asc(reminders.createdAt))

    return rows.map(toReminder)
  }

  async findById(id: string): Promise<Reminder | null> {
    const [row] = await this.db.select().from(reminders).where(this.scoped(id)).limit(1)
    return row ? toReminder(row) : null
  }

  async markDone(id: string): Promise<void> {
    await this.patch(id, { cancelled: true })
  }

  async reschedule(id: string, dueAt: Date): Promise<void> {
    // Đổi giờ thì coi như chưa báo: nếu giữ `firedAt` cũ thì logic "đã thông báo"
    // sẽ bỏ qua lần hẹn mới.
    await this.patch(id, { scheduledAt: dueAt, firedAt: null })
  }

  async remove(id: string): Promise<void> {
    const rows = await this.db.delete(reminders).where(this.scoped(id)).returning()
    if (rows.length === 0) throw notFound(id)
  }

  async markNotified(id: string, at: Date): Promise<void> {
    await this.patch(id, { firedAt: at })
  }

  /** Ghi cột rồi báo nếu không có dòng nào bị ảnh hưởng — nghĩa là id thuộc user khác. */
  private async patch(id: string, changes: Partial<ReminderRow>): Promise<void> {
    const rows = await this.db.update(reminders).set(changes).where(this.scoped(id)).returning()
    if (rows.length === 0) throw notFound(id)
  }

  private scoped(id: string) {
    return and(eq(reminders.id, id), eq(reminders.userId, this.userId))
  }
}

function toReminder(row: ReminderRow): Reminder {
  return {
    id: row.id,
    title: row.title,
    dueAt: row.scheduledAt,
    repeat: (row.repeat ?? 'none') as ReminderRepeat,
    done: row.cancelled ?? false,
    notifiedAt: row.firedAt ?? null,
  }
}

function notFound(id: string): Error {
  return new Error(`Reminder not found: ${id}`)
}

function requireRow<T>(row: T | undefined): T {
  if (!row) throw new Error('Không tạo được reminder')
  return row
}
