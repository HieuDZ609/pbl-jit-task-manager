import { fileURLToPath, pathToFileURL } from 'node:url'

import { migrate } from 'drizzle-orm/pglite/migrator'

export const migrationsFolder = fileURLToPath(new URL('../drizzle', import.meta.url))

type Migratable = Parameters<typeof migrate>[0]

/** Chạy toàn bộ migration chưa áp dụng. Idempotent — gọi lại nhiều lần vẫn an toàn. */
export async function runMigrations(db: Migratable, folder = migrationsFolder): Promise<void> {
  await migrate(db, { migrationsFolder: folder })
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { getDb } = await import('../src/client')
  await runMigrations(getDb())
  console.log('migrate: xong')
}