import { fileURLToPath, pathToFileURL } from 'node:url'

import { migrate } from 'drizzle-orm/pglite/migrator'

/**
 * Suy ra thư mục migration từ vị trí file này.
 *
 * Cố tình là **lazy**: tính lúc gọi chứ không phải lúc import. `import.meta.url`
 * chỉ là URL `file:` khi chạy dưới Node/tsx; trong môi trường khác (vitest
 * với jsdom) nó là URL khác scheme và `fileURLToPath` ném ngay tại module scope —
 * khiến chỉ cần *import* file này cũng vỡ. Import phải không có side effect.
 */
export function defaultMigrationsFolder(): string {
  return fileURLToPath(new URL('../drizzle', import.meta.url))
}

type Migratable = Parameters<typeof migrate>[0]

/** Chạy toàn bộ migration chưa áp dụng. Idempotent — gọi lại nhiều lần vẫn an toàn. */
export async function runMigrations(db: Migratable, folder?: string): Promise<void> {
  await migrate(db, { migrationsFolder: folder ?? defaultMigrationsFolder() })
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { closeDb, getDb } = await import('../src/client')
  try {
    await runMigrations(getDb())
    console.log('migrate: xong')
  } finally {
    // Xem giải thích ở `seed.ts`: không đóng DB thì process không thoát.
    await closeDb()
  }
}
