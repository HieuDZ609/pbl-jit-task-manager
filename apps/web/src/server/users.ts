import { eq } from 'drizzle-orm'

import { users } from '@pbl/db'
import type { AppDb } from '@pbl/db/client'
import { getDb } from '@pbl/db/client'

/**
 * Profile user trả về từ provider OAuth (Google) tại thời điểm đăng nhập.
 */
export type OauthProfile = {
  email: string
  name?: string | null
  avatarUrl?: string | null
}

/** Email chuẩn hoá: trim + lowercase. Google luôn trả email thường, nhưng đừng
 * tin provider — nhiều nguồn khác (test, mock, nhập tay lúc dev) không chuẩn. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function assertEmail(email: string): string {
  const normalized = normalizeEmail(email)
  if (normalized.length === 0 || !normalized.includes('@')) {
    throw new Error(`Email không hợp lệ: "${email}"`)
  }
  return normalized
}

/**
 * Lấy user theo email, tạo nếu chưa có (upsert đúng nghĩa).
 *
 * Dùng `onConflictDoNothing({ target: users.email })` rồi select lại thay vì
 * select-tồn-tại-rồi-mới-insert: cách nào cũng không thoát race, nhưng cách này
 * để **unique index chặn kẻ duy nhất có thể chặn** (DB) — hai request first-login
 * cùng email chạy song song vẫn ra một user.
 *
 * Chỉ ghi `name`/`avatarUrl` lúc tạo mới, không ghi đè dữ liệu user đã có.
 */
export async function findOrCreateUserByEmail(
  profile: OauthProfile,
  db: AppDb = getDb(),
): Promise<{ id: string }> {
  const email = assertEmail(profile.email)

  const [created] = await db
    .insert(users)
    .values({
      email,
      name: profile.name ?? null,
      avatarUrl: profile.avatarUrl ?? null,
    })
    .onConflictDoNothing({ target: users.email })
    .returning({ id: users.id })

  if (created) return created

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)
  if (!existing) {
    // Không thể xảy ra: bản vừa thắng conflict phải có trong DB. Ném kèm email
    // để log không chứa dữ liệu nhạy cảm của user (chỉ email truy vấn lại).
    throw new Error('Không tìm thấy user sau khi upsert — có khi xung đột quá gần')
  }
  return existing
}