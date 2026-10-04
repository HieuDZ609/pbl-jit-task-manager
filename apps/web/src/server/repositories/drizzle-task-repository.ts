import { and, asc, eq, isNull } from 'drizzle-orm'

import { tasks, type AppDb } from '@pbl/db'

import type { Task } from '@/features/tasks/types'

import type {
  CreateTaskInput,
  ListTasksFilter,
  TaskRepository,
  UpdateTaskInput,
} from './task-repository'

type TaskRow = typeof tasks.$inferSelect

/**
 * Adapter Drizzle cho TaskRepository.
 *
 * `userId` gắn vào constructor, không nằm trong method signature: đó là cách
 * buộc mọi truy vấn scope theo user mà không thể quên — không có đường nào gọi
 * được repo mà không truyền user. Interface `TaskRepository` giữ nguyên như cũ
 * nên không phải sửa call site nào (xem `reposFor`).
 */
export class DrizzleTaskRepository implements TaskRepository {
  constructor(
    private readonly db: AppDb,
    private readonly userId: string,
  ) {}

  async create(input: CreateTaskInput): Promise<Task> {
    const [row] = await this.db
      .insert(tasks)
      .values({
        userId: this.userId,
        title: input.title,
        content: input.content ?? null,
        eisenhowerQuadrant: input.eisenhowerQuadrant ?? null,
        dueAt: input.dueAt ?? null,
        startAt: input.startAt ?? null,
        remindAt: input.remindAt ?? null,
        parentId: input.parentId ?? null,
        listId: input.listId ?? null,
        myDayAt: input.myDayAt ?? null,
      })
      .returning()

    return toTask(row)
  }

  async update(id: string, input: UpdateTaskInput): Promise<Task> {
    const changes = definedOnly(input)
    const [row] = await this.db
      .update(tasks)
      .set(changes)
      .where(this.alive(id))
      .returning()

    return toTask(requireRow(row, id))
  }

  async findById(id: string): Promise<Task | null> {
    const [row] = await this.db.select().from(tasks).where(this.alive(id)).limit(1)
    return row ? toTask(row) : null
  }

  async list(filter: ListTasksFilter = {}): Promise<Task[]> {
    const rows = await this.db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, this.userId),
          isNull(tasks.deletedAt),
          filter.eisenhowerQuadrant ? eq(tasks.eisenhowerQuadrant, filter.eisenhowerQuadrant) : undefined,
          filter.listId ? eq(tasks.listId, filter.listId) : undefined,
          filter.isDone === undefined ? undefined : eq(tasks.isDone, filter.isDone),
        ),
      )
      .orderBy(asc(tasks.createdAt))

    return rows.map(toTask)
  }

  async listSubtasks(parentId: string): Promise<Task[]> {
    const rows = await this.db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, this.userId),
          eq(tasks.parentId, parentId),
          isNull(tasks.deletedAt),
        ),
      )
      .orderBy(asc(tasks.createdAt))

    return rows.map(toTask)
  }

  async softDelete(id: string): Promise<void> {
    // Không lọc `deletedAt`: giữ đúng hành vi in-memory, nơi `requireRow` vẫn
    // ném lỗi cho id đã xoá mềm thay vì im lặng ghi đè timestamp.
    const rows = await this.db.update(tasks).set({ deletedAt: new Date() }).where(this.scoped(id)).returning()

    requireRow(rows[0], id)
  }

  async setDone(id: string, isDone: boolean): Promise<Task> {
    const [row] = await this.db
      .update(tasks)
      .set({ isDone, doneAt: isDone ? new Date() : null })
      .where(this.scoped(id))
      .returning()

    return toTask(requireRow(row, id))
  }

  async setMyDay(id: string, myDayAt: Date | null): Promise<Task> {
    const [row] = await this.db
      .update(tasks)
      .set({ myDayAt })
      .where(this.scoped(id))
      .returning()

    return toTask(requireRow(row, id))
  }

  /** Task của user này, còn sống. */
  private alive(id: string) {
    return and(eq(tasks.id, id), eq(tasks.userId, this.userId), isNull(tasks.deletedAt))
  }

  /** Task của user này, kể cả đã xoá mềm. */
  private scoped(id: string) {
    return and(eq(tasks.id, id), eq(tasks.userId, this.userId))
  }
}

function toTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    content: row.content ?? null,
    eisenhowerQuadrant: row.eisenhowerQuadrant ?? null,
    dueAt: row.dueAt ?? null,
    startAt: row.startAt ?? null,
    remindAt: row.remindAt ?? null,
    isDone: row.isDone ?? false,
    doneAt: row.doneAt ?? null,
    parentId: row.parentId ?? null,
    listId: row.listId ?? null,
    myDayAt: row.myDayAt ?? null,
    deletedAt: row.deletedAt ?? null,
  }
}

/**
 * `update` chỉ ghi những key được truyền. `null` là giá trị hợp lệ (xoá
 * `myDayAt`), nên chỉ `undefined` mới bị loại.
 */
function definedOnly(input: UpdateTaskInput): Partial<TaskRow> {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  ) as Partial<TaskRow>
}

/** Message phải khớp in-memory để UI không đổi hành vi khi đổi adapter. */
function requireRow(row: TaskRow | undefined, id: string): TaskRow {
  if (!row) throw new Error(`Task not found: ${id}`)
  return row
}
