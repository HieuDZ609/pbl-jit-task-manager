import { isAuthBypassEnabled } from "./server/auth-bypass"
import { isPublicRoute } from "./features/auth/routes"

import type { NextAuthConfig } from "next-auth"

/**
 * File này được `middleware.ts` import nên chạy ở **edge runtime**: không được
 * import `@pbl/db` hay bất cứ thứ gì dùng Node API. Providers thật và các callback
 * cần DB nằm trong `auth.ts` (runtime thường).
 */
export const authConfig = {
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
