import { describe, it, expect, afterEach } from 'vitest'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { eq } from 'drizzle-orm'

import { users, tasks } from '../src/schema'
import { closeDb, createDb } from '../src/client'
import { runMigrations } from '../scripts/migrate'

/**
 * Bổ sung cho `client.test.ts`: test đó dùng `create table t` ad-hoc, không đi
 * qua schema và migration thật. Test này chạy đúng đường app sẽ chạy —
 * migrate toàn bộ migration rồi insert/select qua các bảng của schema.
 * (Durability qua data dir đã được `client.test.ts` kiểm, không lặp lại ở đây.)
 */
const dirs: string[] = []

afterEach(async () => {
  await closeDb()
  await Promise.all(dirs.splice(0).map((d) => rm(d, { recursive: true, force: true })))
})

describe('db client — tích hợp PGlite với schema thật', () => {
  it('migrate xong thì insert và select qua bảng users/tasks được', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'pbl-task8-'))
    dirs.push(dir)
    const { db } = createDb({ driver: 'pglite', dataDir: dir })

    await runMigrations(db)

    const [user] = await db
      .insert(users)
      .values({ id: crypto.randomUUID(), name: 'Hieu', email: 'hieu@example.com' })
      .returning()
    expect(user?.id).toBeTruthy()

    const [task] = await db
      .insert(tasks)
      .values({ id: crypto.randomUUID(), userId: user!.id, title: 'Task từ Task 8' })
      .returning()
    expect(task?.title).toBe('Task từ Task 8')

    const found = await db.select().from(tasks).where(eq(tasks.title, 'Task từ Task 8'))
    expect(found).toHaveLength(1)
    expect(found[0]?.userId).toBe(user!.id)
  })
})
