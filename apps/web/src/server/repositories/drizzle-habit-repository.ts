import { and, asc, eq, sql } from 'drizzle-orm'

import { habitLogs, habits, type AppDb } from '@pbl/db'

import type { CreateHabitInput, Habit, HabitLog, HabitRepository } from './habit-repository'

type HabitRow = typeof habits.$inferSelect
type HabitLogRow = typeof habitLogs.$inferSelect

/**
 * Adapter Drizzle cho HabitRepository. `userId` gắn vào constructor, không nằm
 * trong method signature: đó là cách buộc mọi truy vấn scope theo user mà không
 * thể quên (xem `DrizzleTaskRepository`).
 *
 * Ngày của `habit_logs` luôn quy về **UTC midnight** và mỗi habit chỉ có một log
 * mỗi ngày — ràng buộc `habit_logs_habit_id_date_uidx` ở DB, không kiểm trong
 * code. Lý do: check-in lần hai trong ngày phải **cộng dồn** `count`, và nếu
 * chỉ kiểm ở code thì hai request song song có thể tạo hai dòng cùng ngày làm
 * streak tính sai. `InMemoryHabitRepository` dùng cùng quy ước UTC để contract
 * test bắt được lệch.
 */
export class DrizzleHabitRepository implements HabitRepository {
  constructor(
    private readonly db: AppDb,
    private readonly userId: string,
  ) {}

  async create(input: CreateHabitInput): Promise<Habit> {
    const [row] = await this.db
      .insert(habits)
      .values({
        userId: this.userId,
        name: input.name,
        color: input.color ?? null,
        frequency: input.frequency ?? 'daily',
        targetCount: input.targetCount ?? 1,
      })
      .returning()

    return toHabit(requireRow(row, 'habit'))
  }

  async listActive(): Promise<Habit[]> {
    const rows = await this.db
      .select()
      .from(habits)
      .where(and(eq(habits.userId, this.userId), eq(habits.archived, false)))
      .orderBy(asc(habits.createdAt))

    return rows.map(toHabit)
  }

  async findById(id: string): Promise<Habit | null> {
    const [row] = await this.db.select().from(habits).where(this.scoped(id)).limit(1)
    return row ? toHabit(row) : null
  }

  async archive(id: string): Promise<void> {
    const rows = await this.db
      .update(habits)
      .set({ archived: true })
      .where(this.scoped(id))
      .returning()

    if (rows.length === 0) throw notFound(id)
  }

  async checkIn(habitId: string, date: Date, increment = 1): Promise<HabitLog> {
    return this.upsertCount(habitId, date, increment, 'cộng')
  }

  async setCount(habitId: string, date: Date, count: number): Promise<HabitLog> {
    return this.upsertCount(habitId, date, count, 'ghi đè')
  }

  async logsFor(habitId: string): Promise<HabitLog[]> {
    const rows = await this.db
      .select()
      .from(habitLogs)
      .where(and(eq(habitLogs.userId, this.userId), eq(habitLogs.habitId, habitId)))
      .orderBy(asc(habitLogs.date))

    return rows.map(toLog)
  }

  /**
   * `mode: 'add'` cộng vào `count` hiện có, `'set'` ghi đè.
   *
   * Dùng `insert ... on conflict do update` để việc cộng dồn là **một** statement
   * — đọc count ra rồi ghi lại sẽ mất thêm khi có hai request cùng lúc.
   */
  private async upsertCount(
    habitId: string,
    date: Date,
    value: number,
    mode: 'cộng' | 'ghi đè',
  ): Promise<HabitLog> {
    await this.requireHabit(habitId)

    const day = utcDay(date)
    const next = mode === 'ghi đè' ? sql`${value}` : sql`${habitLogs.count} + ${value}`

    const [row] = await this.db
      .insert(habitLogs)
      .values({ userId: this.userId, habitId, date: day, count: value })
      .onConflictDoUpdate({
        target: [habitLogs.habitId, habitLogs.date],
        set: { count: next },
      })
      .returning()

    return toLog(requireRow(row, 'habit log'))
  }

  private async requireHabit(id: string): Promise<void> {
    const [row] = await this.db
      .select({ id: habits.id })
      .from(habits)
      .where(this.scoped(id))
      .limit(1)

    if (!row) throw notFound(id)
  }

  /** Habit của user này. Không lọc `archived`: `archive` và `checkIn` vẫn phải chạy được sau khi archive. */
  private scoped(id: string) {
    return and(eq(habits.id, id), eq(habits.userId, this.userId))
  }
}

function toHabit(row: HabitRow): Habit {
  return {
    id: row.id,
    name: row.name,
    color: row.color ?? null,
    icon: row.icon ?? null,
    frequency: (row.frequency ?? 'daily') as Habit['frequency'],
    targetCount: row.targetCount ?? 1,
    startDate: row.startDate ?? new Date(0),
    archived: row.archived ?? false,
  }
}

function toLog(row: HabitLogRow): HabitLog {
  return {
    id: row.id,
    habitId: row.habitId ?? '',
    date: row.date,
    count: row.count ?? 0,
  }
}

/**
 * Ngày UTC midnight của `date`.
 *
 * Không dùng `new Date(date.toISOString().slice(0, 10))` vì chuỗi đó là UTC đã
 * đúng, nhưng dễ đọc sai thành "cắt ngày local". Cắt theo `toISOString()` rồi
 * ghi lại thành UTC là thứ tự duy nhất không đổi ngày ở múi giờ không UTC.
 */
function utcDay(date: Date): Date {
  return new Date(`${date.toISOString().slice(0, 10)}T00:00:00.000Z`)
}

function notFound(id: string): Error {
  return new Error(`Habit not found: ${id}`)
}

function requireRow<T>(row: T | undefined, what: string): T {
  if (!row) throw new Error(`Không tạo được ${what}`)
  return row
}
