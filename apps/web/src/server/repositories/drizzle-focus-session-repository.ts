import { and, asc, eq, gte, sum } from 'drizzle-orm'

import { focusSessions, tasks, type AppDb } from '@pbl/db'

import type {
  FocusSession,
  FocusSessionRepository,
  RecordFocusSessionInput,
} from './focus-session-repository'

type FocusSessionRow = typeof focusSessions.$inferSelect

/**
 * Adapter Drizzle cho FocusSessionRepository. `userId` gắn vào constructor nên mọi
 * truy vấn scope theo user không thể quên (xem `DrizzleTaskRepository`).
 */
export class DrizzleFocusSessionRepository implements FocusSessionRepository {
  constructor(
    private readonly db: AppDb,
    private readonly userId: string,
  ) {}

  async record(input: RecordFocusSessionInput): Promise<FocusSession> {
    if (input.taskId !== null && input.taskId !== undefined) {
      await this.requireTask(input.taskId)
    }

    const [row] = await this.db
      .insert(focusSessions)
      .values({
        userId: this.userId,
        mode: input.mode,
        startedAt: input.startedAt,
        endedAt: input.endedAt,
        durationMin: input.durationMin,
        completed: input.completed,
        taskId: input.taskId ?? null,
      })
      .returning()

    return toSession(requireRow(row, 'focus session'))
  }

  /**
   * Chặn `task_id` trỏ sang task của user khác.
   *
   * `focus_sessions.task_id` chỉ được FK ràng buộc theo `id`, không theo user, nên
   * DB sẽ cho insert bình thường. Mà `taskId` lại đến từ server action
   * (`logFocusSession`) — tức là client gửi lên và kiểm soát được. Không kiểm ở
   * đây thì người dùng đặt được phiên tập trung của mình trỏ sang task của
   * người khác, và khi đọc lại phiên thì `taskId` lộ ra cả id lẫn *sự tồn tại* của
   * task đó.
   *
   * Cùng lý do với `assertFolder` trong `DrizzleFolderListRepository` và
   * `requireHabit` trong `DrizzleHabitRepository`: kiểm nằm ở adapter để mọi
   * đường gọi đều được bảo vệ, không chỉ những action nào biết phải tự kiểm.
   */
  private async requireTask(id: string): Promise<void> {
    const [row] = await this.db
      .select({ id: tasks.id })
      .from(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, this.userId)))
      .limit(1)

    if (!row) throw new Error(`Task not found: ${id}`)
  }

  async listSince(from: Date): Promise<FocusSession[]> {
    const rows = await this.db
      .select()
      .from(focusSessions)
      .where(and(eq(focusSessions.userId, this.userId), gte(focusSessions.startedAt, from)))
      .orderBy(asc(focusSessions.startedAt))

    return rows.map(toSession)
  }

  /**
   * Cộng trong DB thay vì kéo hết về JS rồi `reduce`.
   *
   * `sum` trả `string | null` với cột số của Postgres, và `null` khi không có
   * dòng nào — cả hai phải về `0`, không phải `NaN`, vì số này đi thẳng lên
   * dashboard.
   */
  async totalCompletedWorkMinutes(from: Date): Promise<number> {
    const [row] = await this.db
      .select({ total: sum(focusSessions.durationMin) })
      .from(focusSessions)
      .where(
        and(
          eq(focusSessions.userId, this.userId),
          gte(focusSessions.startedAt, from),
          eq(focusSessions.mode, 'work'),
          eq(focusSessions.completed, true),
        ),
      )

    return Number(row?.total ?? 0)
  }
}

function toSession(row: FocusSessionRow): FocusSession {
  return {
    id: row.id,
    mode: (row.mode ?? 'work') as FocusSession['mode'],
    startedAt: row.startedAt ?? new Date(0),
    endedAt: row.endedAt ?? row.startedAt ?? new Date(0),
    durationMin: row.durationMin ?? 0,
    completed: row.completed ?? false,
    taskId: row.taskId ?? null,
  }
}

function requireRow<T>(row: T | undefined, what: string): T {
  if (!row) throw new Error(`Không tạo được ${what}`)
  return row
}
