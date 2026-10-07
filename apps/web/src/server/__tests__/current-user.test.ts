// `currentUserId()` đọc DB thật qua `getDb()` (dev fallback) và session qua
// `auth()` (NextAuth). Chạy dưới Node — `auth()` ngoài request scope của Next
// sẽ ném, nên mock `@/auth`.
// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { randomUUID } from 'node:crypto'
import { users } from '@pbl/db'
import { createDb, type AppDb } from '@pbl/db/client'
import { runMigrations } from '@pbl/db/scripts/migrate'

/**
 * `currentUserId()` là seam duy nhất mọi call site dùng để biết "tôi là ai".
 * Priority: session Google > dev fallback (khi bypass) > FAIL CLOSED. Fail
 * closed nghĩa là ném lỗi chứ không trả user mặc định — nếu trả user mặc định
 * thì mọi request của mọi người (kể cả kẻ chưa đăng nhập) dùng chung tài khoản
 * và đọc/ghi được dữ liệu của nhau.
 */
const dbHolder: { current: AppDb | null } = { current: null }
const authMock = vi.fn()

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

vi.mock('@/auth', () => ({
  auth: () => authMock(),
}))

const { currentUserId } = await import('../current-user')

const DEV_EMAIL = 'dev@pbl.local'
let close: (() => Promise<void>) | null = null

beforeEach(async () => {
  vi.stubEnv('NODE_ENV', 'development')
  vi.stubEnv('PBL_DEV_USER_EMAIL', DEV_EMAIL)
  authMock.mockReset()
  const handle = createDb({ driver: 'pglite', key: randomUUID() })
  close = handle.close
  dbHolder.current = handle.db
  await runMigrations(handle.db)
})

afterEach(async () => {
  await close?.()
  close = null
  dbHolder.current = null
  authMock.mockReset()
  vi.unstubAllEnvs()
})

describe('currentUserId', () => {
  it('trả session.userId khi có session Google (ưu tiên trên cả bypass)', async () => {
    const uid = randomUUID()
    authMock.mockResolvedValue({ userId: uid })
    vi.stubEnv('PBL_AUTH_BYPASS', 'true')

    // Không cần seed user dev: session thắng ngay cả khi bypass bật.
    await expect(currentUserId()).resolves.toBe(uid)
  })

  it('trả session.userId trong production (luồng thật)', async () => {
    const uid = randomUUID()
    authMock.mockResolvedValue({ userId: uid })
    vi.stubEnv('NODE_ENV', 'production')

    await expect(currentUserId()).resolves.toBe(uid)
  })

  it('khi không có session: fallback sang user dev nếu bypass bật và đã seed', async () => {
    authMock.mockResolvedValue(null)
    vi.stubEnv('PBL_AUTH_BYPASS', 'true')
    await dbHolder.current!.insert(users).values({ id: randomUUID(), email: DEV_EMAIL })

    await expect(currentUserId()).resolves.toMatch(/^[0-9a-f-]{36}$/)
  })

  it('fallback ném lỗi kèm hướng dẫn seed khi chưa seed user dev', async () => {
    authMock.mockResolvedValue(null)
    vi.stubEnv('PBL_AUTH_BYPASS', 'true')

    await expect(currentUserId()).rejects.toThrow(/pnpm --filter @pbl\/db seed/)
  })

  it('fallback tôn trọng PBL_DEV_USER_EMAIL', async () => {
    authMock.mockResolvedValue(null)
    vi.stubEnv('PBL_AUTH_BYPASS', 'true')
    const email = 'khac@pbl.local'
    await dbHolder.current!.insert(users).values({ id: randomUUID(), email })
    vi.stubEnv('PBL_DEV_USER_EMAIL', email)

    await expect(currentUserId()).resolves.toMatch(/^[0-9a-f-]{36}$/)

    await dbHolder.current!.delete(users)
    await expect(currentUserId()).rejects.toThrow(new RegExp(email.replace('.', '\\.')))
  })

  it('fail closed: không session, không bypass → ném lỗi, bất kể có user dev hay không', async () => {
    authMock.mockResolvedValue(null)
    // PBL_AUTH_BYPASS chưa set = tắt.
    await dbHolder.current!.insert(users).values({ id: randomUUID(), email: DEV_EMAIL })

    await expect(currentUserId()).rejects.toThrow(/đăng nhập bằng Google/)
  })

  it('fail closed ở production: không session → ném, không đụng DB', async () => {
    authMock.mockResolvedValue(null)
    vi.stubEnv('NODE_ENV', 'production')
    dbHolder.current = null

    // `getDb()` sẽ ném nếu bị gọi; hàm phải dừng mà không truy vấn.
    await expect(currentUserId()).rejects.toThrow(/đăng nhập bằng Google/)
  })
})