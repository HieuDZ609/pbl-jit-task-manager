import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { describe, expect, it } from 'vitest'

import { resetDatabase } from '../scripts/reset'
import { runMigrations } from '../scripts/migrate'

describe('resetDatabase', () => {
  it('xoá sạch dữ liệu nhưng schema được migrate lại đầy đủ', async () => {
    const client = new PGlite()
    const db = drizzle(client)
    await runMigrations(db)
    await db.execute(
      "insert into folders (id, name, sort_order) values ('11111111-1111-4111-8111-111111111111', 'Việc', 0)",
    )
    expect((await db.execute('select count(*) from folders')).rows[0]).toMatchObject({ count: 1 })

    await resetDatabase(db)

    expect((await db.execute('select count(*) from folders')).rows[0]).toMatchObject({ count: 0 })
    const tables = await db.execute<{ table_name: string }>(
      "select table_name from information_schema.tables where table_schema = 'public'",
    )
    expect(tables.rows.map((r) => r.table_name)).toEqual(expect.arrayContaining(['folders', 'tasks']))
  })

  it('chạy trên database đã có migration cũ hơn cũng không lỗi', async () => {
    const client = new PGlite()
    const db = drizzle(client)
    await db.execute('create table legacy (x int)')

    await resetDatabase(db)

    const leftover = await db.execute<{ table_name: string }>(
      "select table_name from information_schema.tables where table_schema = 'public' and table_name = 'legacy'",
    )
    expect(leftover.rows).toEqual([])
  })
})