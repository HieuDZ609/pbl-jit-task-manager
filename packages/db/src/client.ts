import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'

import { PGlite } from '@electric-sql/pglite'
import { drizzle as drizzleNodePg } from 'drizzle-orm/node-postgres'
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite'
import { Pool } from 'pg'

import * as schema from './schema'

export type DbDriver = 'pglite' | 'pg'

export type DbOptions = {
  driver: DbDriver
  /** Thư mục lưu dữ liệu PGlite. Bỏ trống = in-memory. */
  dataDir?: string
  /** Connection string cho driver `pg`. Mặc định lấy từ DATABASE_URL. */
  url?: string
  /** Khoá cache riêng — chỉ dùng trong test. */
  key?: unknown
}

export type AppDb = ReturnType<typeof drizzlePglite<typeof schema>> &
  ReturnType<typeof drizzleNodePg<typeof schema>>

export type DbHandle = { db: AppDb; close: () => Promise<void> }

export function createDb(options: DbOptions): DbHandle {
  if (options.driver === 'pg') {
    const url = options.url ?? process.env.DATABASE_URL
    if (!url) {
      throw new Error('driver "pg" cần DATABASE_URL (hoặc truyền options.url)')
    }
    const pool = new Pool({ connectionString: url })
    return {
      db: drizzleNodePg(pool, { schema }) as unknown as AppDb,
      close: () => pool.end(),
    }
  }

  const client = new PGlite(options.dataDir)
  return {
    db: drizzlePglite(client, { schema }) as unknown as AppDb,
    close: () => client.close(),
  }
}

/**
 * Cache phải nằm trên `globalThis`, **không** ở module scope.
 *
 * Next bundle `@pbl/db` thành một bản riêng cho mỗi route graph, nên `Map` ở
 * module scope thực chất là N cache cho cùng một tiến trình ⇒ N PGlite instance
 * cùng mở một data dir. PGlite là Postgres trong WASM và chỉ chịu được một
 * instance mở data dir tại một thời điểm, nên các instance sau sẽ `Aborted()`
 * (E2E lộ ra đúng lỗi này: mọi trang đọc DB đều 500).
 *
 * `globalThis` là nơi duy nhất dùng chung được giữa các bundle trong cùng tiến
 * trình Node.
 */
const globalForDb = globalThis as unknown as { __pblDbCache?: Map<string, DbHandle> }
const cache = (globalForDb.__pblDbCache ??= new Map<string, DbHandle>())

/** Singleton theo driver + dataDir, để không tạo nhiều PGlite instance trong dev. */
export function getDb(options?: DbOptions): AppDb {
  const driver = options?.driver ?? (process.env.PBL_DB_DRIVER === 'pg' ? 'pg' : 'pglite')
  const dataDir = options?.dataDir ?? (driver === 'pglite' ? defaultPgliteDir() : undefined)
  const url = options?.url ?? process.env.DATABASE_URL
  const key = options?.key === undefined ? `${driver}:${dataDir ?? url ?? ''}` : String(options.key)

  let handle = cache.get(key)
  if (!handle) {
    handle = createDb({ driver, dataDir, url })
    cache.set(key, handle)
  }
  return handle.db
}

export async function closeDb(): Promise<void> {
  await Promise.all([...cache.values()].map((handle) => handle.close()))
  cache.clear()
}

/**
 * Thư mục dữ liệu PGlite mặc định: `packages/db/.pglite`.
 *
 * Phải là **default dùng chung** chứ không chỉ đọc env, vì app và script chạy ở
 * hai tiến trình khác nhau với cwd khác nhau: `pnpm dev` gọi `tsx scripts/*.ts`
 * (cwd = `packages/db`, không đọc `.env.local`) còn Next thì đọc `.env.local`. Nếu
 * chỉ dựa vào env thì hai bên trỏ hai data dir khác nhau ⇒ migrate/seed viết
 * chỗ này còn app đọc chỗ kia ⇒ user seed không tồn tại, `currentUserId()` ném
 * lỗi. Một default nằm trong package khiến cả hai khớp nhau.
 *
 * Dò lên từ `process.cwd()` chứ không dùng `import.meta.url`: file này được Next
 * bundle vào `.next/`, nên `import.meta.url` lúc chạy trỏ vào bundle ⇒
 * `../.pglite` rơi vào `.next/.pglite`, tách khỏi data dir của script. cwd thì
 * ổn định ở cả hai tiến trình (`packages/db` khi chạy script, `apps/web` khi
 * chạy Next) và nhiều tầng hơn vẫn tìm thấy vì dò ngược lên root repo.
 */
function defaultPgliteDir(): string {
  const fromEnv = process.env.PBL_PGLITE_DIR
  if (fromEnv) return fromEnv

  let dir = process.cwd()
  for (;;) {
    const candidate = join(dir, 'packages', 'db')
    if (existsSync(join(candidate, 'package.json'))) return join(candidate, '.pglite')
    const parent = dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  // Chạy ngoài repo (ví dụ script đóng gói riêng): rơi về cwd.
  return join(process.cwd(), '.pglite')
}

