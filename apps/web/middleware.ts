import NextAuth from "next-auth"
import { authConfig } from "./src/auth.config"

const { auth } = NextAuth(authConfig)

export default auth(() => {
  // Quyết định truy cập nằm trong callbacks.authorized của authConfig.
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
}
