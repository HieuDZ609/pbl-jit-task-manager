import { pathToFileURL } from 'node:url'

import { migrate } from 'drizzle-orm/pglite/migrator'

import { runMigrations } from './migrate'

type Migratable = Parameters<typeof migrate>[0]

/** Xoá toàn bộ schema `public` rồi migrate lại từ đầu. Dùng cho `pnpm db:reset`. */
export async function resetDatabase(db: Migratable): Promise<void> {
  // Schema 'drizzle' giữ bảng __drizzle_migrations; phải xoá cùng lúc
  // nếu không migrator sẽ tưởng migration đã chạy và không tạo lại bảng nào.
  await db.execute('drop schema if exists public cascade')
  await db.execute('drop schema if exists drizzle cascade')
  await db.execute('create schema public')
  await runMigrations(db)
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { getDb } = await import('../src/client')
  await resetDatabase(getDb())
  console.log('reset: schema đã được dựng lại từ migration')
}