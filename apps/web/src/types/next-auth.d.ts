import "next-auth"
import "next-auth/jwt"

/**
 * Nới rộng type Session/JWT của Auth.js để mang `userId` — id user của **DB
 * app** (không phải `sub` provider Google). `jwt.id`/`user.id` của Auth.js là id
 * nội bộ provider, không được dùng làm id user, tránh nhầm lẫn giữa hai nguồn id.
 */
declare module "next-auth" {
  interface Session {
    userId?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    /** Id user trong bảng `users` của app. Luôn có sau lần đăng nhập đầu tiên. */
    userId?: string
  }
}