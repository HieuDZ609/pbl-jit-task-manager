// `currentUserId()` đọc DB thật qua `getDb()`, nên test này cần PGlite và phải
// chạy dưới Node (không phải jsdom).
// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { randomUUID } from 'node:crypto'
import { users } from '@pbl/db'
import { createDb, type AppDb } from '@pbl/db/client'
import { runMigrations } from '@pbl/db/scripts/migrate'

/**
 * `currentUserId()` là seam duy nhất mọi call site dùng để biết "tôi là ai".
 * Nó **fail closed** ở production, và đó là thứ đáng test nhất ở đây: nếu ai đó
 * sau này đổi thành trả user mặc định thì mọi request — kể cả của người chưa
 * đăng nhập — sẽ dùng chung một tài khoản và đọc được dữ liệu của nhau.
 *
 * `getDb` bị mock để test không chạm vào data dir thật của `packages/db/.pglite`.
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

const { currentUserId } = await import('../current-user')

const DEV_EMAIL = 'dev@pbl.local'
let close: (() => Promise<void>) | null = null

beforeEach(async () => {
  vi.stubEnv('NODE_ENV', 'development')
  vi.stubEnv('PBL_DEV_USER_EMAIL', DEV_EMAIL)
  const handle = createDb({ driver: 'pglite', key: randomUUID() })
  close = handle.close
  dbHolder.current = handle.db
  await runMigrations(handle.db)
})

afterEach(async () => {
  await close?.()
  close = null
  dbHolder.current = null
  vi.unstubAllEnvs()
})

describe('currentUserId', () => {
  it('trả id của user dev đã seed', async () => {
    await dbHolder.current!.insert(users).values({ id: randomUUID(), email: DEV_EMAIL })

    await expect(currentUserId()).resolves.toMatch(/^[0-9a-f-]{36}$/)
  })

  it('ném lỗi khi chưa seed, kèm hướng dẫn cụ thể', async () => {
    // Bảo đảm thông điệp lỗi chỉ đường tới lệnh seed, thay vì lỗi DB chung chung.
    await expect(currentUserId()).rejects.toThrow(/pnpm --filter @pbl\/db seed/)
  })

  it('tôn trọng PBL_DEV_USER_EMAIL khi được đổi', async () => {
    const email = 'khac@pbl.local'
    await dbHolder.current!.insert(users).values({ id: randomUUID(), email })
    vi.stubEnv('PBL_DEV_USER_EMAIL', email)

    // Chỉ seed email mới ⇒ email cũ không còn trong DB; hàm phải theo env.
    await expect(currentUserId()).resolves.toMatch(/^[0-9a-f-]{36}$/)

    // Bỏ user mới đi rồi hỏi lại: thông điệp lỗi phải nêu đúng email từ env.
    await dbHolder.current!.delete(users)
    await expect(currentUserId()).rejects.toThrow(new RegExp(email.replace('.', '\\.')))
  })

  it('fail closed ở production: ném lỗi, không bao giờ trả user mặc định', async () => {
    // Có user trong DB vẫn phải ném — điểm mấu chốt là *có* sẵn user cũng không
    // được tự ý dùng làm danh tính chung.
    await dbHolder.current!.insert(users).values({ id: randomUUID(), email: DEV_EMAIL })
    vi.stubEnv('NODE_ENV', 'production')

    await expect(currentUserId()).rejects.toThrow(/Task 13/)
  })

  it('không đụng DB ở production (ném trước cả khi truy vấn)', async () => {
    dbHolder.current = null
    vi.stubEnv('NODE_ENV', 'production')

    // `getDb()` sẽ ném nếu bị gọi; hàm phải dừng ở check production.
    await expect(currentUserId()).rejects.toThrow(/Task 13/)
  })
})
