import { describe, it, expect } from 'vitest'
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { eq } from 'drizzle-orm'

import * as schema from '../../src/schema'
import { users, folders, lists } from '../../src/schema'
import { runMigrations } from '../migrate'
import { seed } from '../seed'

/**
 * Dev server tự chạy seed mỗi lần khởi động. Nếu seed không idempotent thì mỗi
 * lần `pnpm dev` lại nhân bản dữ liệu mẫu. Đây là bảo đảm quan trọng nhất
 * của Task 9.
 */
describe('seed', () => {
  it('tạo dev user, folder và list mẫu', async () => {
    const db = drizzle(new PGlite(), { schema })
    await runMigrations(db)

    const result = await seed(db)

    expect(result.userId).toBeTruthy()
    const allUsers = await db.select().from(users)
    expect(allUsers).toHaveLength(1)
    expect(allUsers[0]?.name).toBe('Dev User')
    const allFolders = await db.select().from(folders)
    expect(allFolders).toHaveLength(1)
    expect(allFolders[0]?.userId).toBe(allUsers[0]?.id)
    const allLists = await db.select().from(lists)
    expect(allLists).toHaveLength(1)
    expect(allLists[0]?.folderId).toBe(allFolders[0]?.id)
  })

  it('chạy hai lần không nhân bản (idempotent)', async () => {
    const db = drizzle(new PGlite(), { schema })
    await runMigrations(db)

    const first = await seed(db)
    const second = await seed(db)

    expect(second.userId).toBe(first.userId)
    expect(await db.select().from(users)).toHaveLength(1)
    expect(await db.select().from(folders)).toHaveLength(1)
    expect(await db.select().from(lists)).toHaveLength(1)
  })

  it('giữ nguyên dữ liệu người dùng đã có, không ghi đè tên', async () => {
    const db = drizzle(new PGlite(), { schema })
    await runMigrations(db)
    await seed(db)

    await db.update(users).set({ name: 'Tên do tôi đặt' })

    await seed(db)

    const row = await db.select().from(users).where(eq(users.name, 'Tên do tôi đặt'))
    expect(row).toHaveLength(1)
  })

  it('seed vào db đã migrate sẵn không lỗi', async () => {
    const db = drizzle(new PGlite(), { schema })
    await runMigrations(db)
    await seed(db)
    await expect(seed(db)).resolves.toMatchObject({ created: { users: 0 } })
  })
})
