// `findOrCreateUserByEmail` đọc/ghi DB thật qua `getDb()`, chạy dưới Node.
// @vitest-environment node
import { randomUUID } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { eq } from 'drizzle-orm'

import { users } from '@pbl/db'
import { createDb, type AppDb } from '@pbl/db/client'
import { runMigrations } from '@pbl/db/scripts/migrate'

/**
 * Upsert user theo email, dùng cho callback `jwt` khi user Google đăng nhập lần
 * đầu (hoặc quay lại). Điểm mấu chốt: phải **idempotent và chịu được chạy song
 * song** — hai request first-login của cùng một email (tabs song song, callback
 * trùng) mà insert không conflict-safe thì một trong hai sẽ chết vì unique index,
 * hoặc tệ hơn, không có unique thì tạo ra hai user.
 */
const dbHolder: { current: AppDb | null } = { current: null }

vi.mock('@pbl/db/client', async () => {
  const actual = await vi.importActual<typeof import('@pbl/db/client')>('@pbl/db/client')
  return {
    ...actual,
    getDb: () => {
      if (dbHolder.current === null) throw new Error('test chưa dựng DB')
      return dbHolder.current
    },
  }
})

const { findOrCreateUserByEmail } = await import('../users')

let close: (() => Promise<void>) | null = null

beforeEach(async () => {
  const handle = createDb({ driver: 'pglite', key: randomUUID() })
  close = handle.close
  dbHolder.current = handle.db
  await runMigrations(handle.db)
})

afterEach(async () => {
  await close?.()
  close = null
  dbHolder.current = null
})

async function countUsers(): Promise<number> {
  const rows = await dbHolder.current!.select({ id: users.id }).from(users)
  return rows.length
}

describe('findOrCreateUserByEmail', () => {
  it('tạo user mới khi email chưa tồn tại', async () => {
    const result = await findOrCreateUserByEmail({ email: 'hieu@example.com', name: 'Hieu' })

    expect(result.id).toMatch(/^[0-9a-f-]{36}$/)
    expect(await countUsers()).toBe(1)
    const [row] = await dbHolder.current!
      .select()
      .from(users)
      .where(eq(users.email, 'hieu@example.com'))
    expect(row.name).toBe('Hieu')
  })

  it('trả về user đã có, không tạo bản thứ hai', async () => {
    const first = await findOrCreateUserByEmail({ email: 'hieu@example.com', name: 'A' })
    const second = await findOrCreateUserByEmail({ email: 'hieu@example.com', name: 'B' })

    expect(second.id).toBe(first.id)
    expect(await countUsers()).toBe(1)
  })

  it('chuẩn hoá email (trim + lowercase) trước khi trùng khớp', async () => {
    const first = await findOrCreateUserByEmail({ email: '  Hieu@Example.COM ' })
    const second = await findOrCreateUserByEmail({ email: 'hieu@example.com' })

    expect(second.id).toBe(first.id)
    expect(await countUsers()).toBe(1)
    const [row] = await dbHolder.current!.select({ email: users.email }).from(users)
    expect(row.email).toBe('hieu@example.com')
  })

  it('an toàn khi hai lần cùng email chạy song song (race lần đầu)', async () => {
    const [a, b] = await Promise.all([
      findOrCreateUserByEmail({ email: 'race@example.com', name: 'R' }),
      findOrCreateUserByEmail({ email: 'race@example.com', name: 'R' }),
    ])

    expect(a.id).toBe(b.id)
    expect(await countUsers()).toBe(1)
  })

  it('không ghi đè name/avatarUrl của user đã tồn tại', async () => {
    await findOrCreateUserByEmail({
      email: 'keep@example.com',
      name: 'Gốc',
      avatarUrl: 'https://goc',
    })
    await findOrCreateUserByEmail({
      email: 'keep@example.com',
      name: 'Mới',
      avatarUrl: 'https://moi',
    })

    const [row] = await dbHolder.current!.select().from(users)
    expect(row.name).toBe('Gốc')
    expect(row.avatarUrl).toBe('https://goc')
  })

  it('lưu avatarUrl khi tạo user mới', async () => {
    await findOrCreateUserByEmail({
      email: 'av@example.com',
      name: 'Av',
      avatarUrl: 'https://picsum.photos/200',
    })

    const [row] = await dbHolder.current!.select().from(users)
    expect(row.avatarUrl).toBe('https://picsum.photos/200')
  })

  it('ném lỗi khi thiếu email', async () => {
    await expect(findOrCreateUserByEmail({ email: '   ' })).rejects.toThrow(/email/i)
  })
})