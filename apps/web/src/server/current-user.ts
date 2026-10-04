import { eq } from 'drizzle-orm'

import { users } from '@pbl/db'
import { getDb } from '@pbl/db/client'

/**
 * Phải khớp `DEV_USER_EMAIL` trong `packages/db/scripts/seed.ts`. Nếu một trong hai
 * đổi, `pnpm dev` sẽ seed user A còn app tìm user B ⇒ lỗi "không tìm thấy user dev".
 */
const DEV_USER_EMAIL = 'dev@pbl.local'

/**
 * User id của request hiện tại.
 *
 * **Đây là seam tạm** cho tới Task 13 (login/register thật). Chỉ cần sửa hàm này
 * là mọi call site đổi sang session thật — không cần sửa chỗ nào khác.
 *
 * Cố tình **fail closed**: ở production, hàm ném lỗi chứ không trả user mặc
 * định. Nếu trả user mặc định thì mọi request của mọi người — kể cả kẻ chưa đăng
 * nhập — sẽ dùng chung một tài khoản và đọc/ghi được dữ liệu của nhau. App sẽ
 * lỗi cho tới khi Task 13 lên, đó là trạng thái đúng: đã có scoping theo user
 * nhưng chưa có danh tính để scoping vào.
 */
export async function currentUserId(): Promise<string> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'currentUserId(): chưa có đăng nhập (Task 13). Cố tình ném lỗi thay vì trả user mặc định — ' +
        'trả user mặc định nghĩa là mọi request đều dùng chung một tài khoản.',
    )
  }

  const email = process.env.PBL_DEV_USER_EMAIL ?? DEV_USER_EMAIL
  const rows = await getDb().select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1)
  const found = rows[0]

  if (!found) {
    throw new Error(
      `Không tìm thấy user dev "${email}". Chạy \`pnpm --filter @pbl/db seed\` để tạo dữ liệu mẫu.`,
    )
  }

  return found.id
}
