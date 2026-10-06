import { eq } from 'drizzle-orm'

import { users } from '@pbl/db'
import { getDb } from '@pbl/db/client'
import { auth } from '@/auth'
import { isAuthBypassEnabled } from './auth-bypass'

/**
 * Phải khớp `DEV_USER_EMAIL` trong `packages/db/scripts/seed.ts`. Nếu một trong hai
 * đổi, `pnpm dev` sẽ seed user A còn app tìm user B ⇒ lỗi "không tìm thấy user dev".
 */
const DEV_USER_EMAIL = 'dev@pbl.local'

/**
 * Id user DB của request hiện tại.
 *
 * Thứ tự ưu tiên:
 * 1. `session.userId` từ luồng Google (id user trong bảng `users` của app).
 * 2. Dev fallback: chỉ khi `PBL_AUTH_BYPASS=true` (non-production), trả user dev.
 * 3. Ném lỗi — **fail closed**. Không bao giờ trả một user mặc định "cho vui":
 *    mọi request của mọi người — kể cả kẻ chưa đăng nhập — sẽ dùng chung một tài
 *    khoản và đọc/ghi được dữ liệu của nhau.
 */
export async function currentUserId(): Promise<string> {
  const session = await auth()
  if (session?.userId) return session.userId

  if (isAuthBypassEnabled()) {
    const email = process.env.PBL_DEV_USER_EMAIL ?? DEV_USER_EMAIL
    const rows = await getDb()
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1)
    const found = rows[0]

    if (!found) {
      throw new Error(
        `Không tìm thấy user dev "${email}". Chạy \`pnpm --filter @pbl/db seed\` để tạo dữ liệu mẫu.`,
      )
    }

    return found.id
  }

  throw new Error('currentUserId(): không có session đăng nhập — hãy đăng nhập bằng Google.')
}