import NextAuth from "next-auth"
import { authConfig } from "./src/auth.config"

const { auth } = NextAuth(authConfig)

// Dùng dạng KHÔNG wrapper: `auth` được gọi trực tiếp với Request của middleware
// để NextAuth áp dụng `callbacks.authorized` → redirect khi chưa đăng nhập.
// Dạng có callback (`auth(() => {})`) bỏ qua bước redirect, chỉ gán request.auth.
export default auth

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
}
