import { isAuthBypassEnabled } from "./server/auth-bypass"
import { isPublicRoute } from "./features/auth/routes"

import type { NextAuthConfig } from "next-auth"

/**
 * File này được `middleware.ts` import nên chạy ở **edge runtime**: không được
 * import `@pbl/db` hay bất cứ thứ gì dùng Node API. Providers thật và các callback
 * cần DB nằm trong `auth.ts` (runtime thường).
 */
export const authConfig = {
  // Bắt buộc khớp chính xác redirect URI đã khai báo trên Google Console:
  // `https://localhost:5678/auth/callback/google` (Auth.js luôn dùng
  // `<basePath>/callback/<provider>` — không thể đổi layout này được).
  basePath: "/auth",
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      if (isAuthBypassEnabled()) return true
      if (isPublicRoute(nextUrl.pathname)) return true
      return !!auth?.user
    },
  },
  providers: [],
} satisfies NextAuthConfig
