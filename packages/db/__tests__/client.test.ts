import { describe, expect, it } from 'vitest'

import { closeDb, createDb, getDb } from '../src/client'

describe('createDb', () => {
  it('driver pglite: tạo db đọc/ghi được trên Postgres nhúng', async () => {
    const { db, close } = createDb({ driver: 'pglite' })
    try {
      await db.execute('create table t (id int)')
      await db.execute('insert into t values (1)')
      const rows = await db.execute<{ id: number }>('select id from t')
      expect(rows.rows).toEqual([{ id: 1 }])
    } finally {
      await close()
    }
  })

  it('driver pglite với dataDir: dữ liệu còn lại sau khi đóng và mở lại', async () => {
    const dataDir = await mkdtemp()
    const first = createDb({ driver: 'pglite', dataDir })
    await first.db.execute('create table t (v text)')
    await first.db.execute("insert into t values ('keep')")
    await first.close()

    const second = createDb({ driver: 'pglite', dataDir })
    try {
      const rows = await second.db.execute<{ v: string }>('select v from t')
      expect(rows.rows).toEqual([{ v: 'keep' }])
    } finally {
      await second.close()
    }
  })

  it('driver pg thiếu url thì báo lỗi rõ ràng', () => {
    expect(() => createDb({ driver: 'pg', url: undefined })).toThrowError(/DATABASE_URL/)
  })
})

describe('getDb', () => {
  it('trả về cùng một instance cho cùng driver', () => {
    const a = getDb({ driver: 'pglite' })
    const b = getDb({ driver: 'pglite' })
    expect(a).toBe(b)
  })

  it('closeDb giải phóng instance đã cache', async () => {
    getDb({ driver: 'pglite' })
    await closeDb()
    expect(getDb({ driver: 'pglite' })).not.toBe(getDb({ driver: 'pglite', key: Symbol() }))
  })
})

async function mkdtemp(): Promise<string> {
  const { mkdtemp: mk } = await import('node:fs/promises')
  const { tmpdir } = await import('node:os')
  const { join } = await import('node:path')
  return mk(join(tmpdir(), 'pbl-pglite-'))
}