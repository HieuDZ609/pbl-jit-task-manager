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

const cache = new Map<string, DbHandle>()

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

function defaultPgliteDir(): string | undefined {
  return process.env.PBL_PGLITE_DIR
}
