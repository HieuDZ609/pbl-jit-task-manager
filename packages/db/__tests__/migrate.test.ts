import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { describe, expect, it } from 'vitest'

import { runMigrations } from '../scripts/migrate'

async function tableNames(client: PGlite): Promise<string[]> {
  const result = await client.query<{ table_name: string }>(
    "select table_name from information_schema.tables where table_schema = 'public'",
  )
  return result.rows.map((row) => row.table_name)
}

describe('runMigrations', () => {
  it('tạo toàn bộ bảng trong schema trên PGlite trống', async () => {
    const client = new PGlite()
    const db = drizzle(client)

    await runMigrations(db)

    expect(await tableNames(client)).toEqual(
      expect.arrayContaining([
        'folders',
        'lists',
        'tasks',
        'checklists',
        'habits',
        'habit_logs',
        'focus_sessions',
        'elearning_items',
        'reminders',
        'preferences',
      ]),
    )
  })

  it('chạy lần hai không lỗi và không nhân bản bảng', async () => {
    const client = new PGlite()
    const db = drizzle(client)

    await runMigrations(db)
    await runMigrations(db)

    expect((await tableNames(client)).filter((name) => name === 'tasks')).toHaveLength(1)
  })
})