import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { authConfig } from "./auth.config"
import { findOrCreateUserByEmail } from "./server/users"

/**
 * Runtime thường (Node): giữ `authConfig` (authorized dùng cho middleware) và
 * bổ sung callback cần DB — `jwt`/`session`. Middleware KHÔNG import file này,
 * chỉ import `auth.config.ts` (edge-safe, không chạm `@pbl/db`).
 */
export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [Google],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      // `user` chỉ có ở lần sign-in thật (OAuth callback), không có khi đọc lại
      // session từ cookie cũ. Upsert xong gắn id user DB của app vào token.
      if (user?.email) {
        const { id } = await findOrCreateUserByEmail({
          email: user.email,
          name: user.name,
          avatarUrl: user.image,
        })
        token.userId = id
      }
      return token
    },
    async session({ session, token }) {
      if (token.userId) session.userId = token.userId
      return session
    },
  },
})