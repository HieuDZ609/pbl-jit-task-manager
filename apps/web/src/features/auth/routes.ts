/**
 * Route cho phép truy cập mà không cần đăng nhập.
 *
 * **Allowlist, không phải denylist.** Mặc định mọi route đều private: thêm một trang
 * app mới thì không cần nhớ vào sửa chỗ này, ngược lại có quên thì trang bị chặn
 * chứ không bị lộ. Với denylist thì mỗi trang app là một rủi ro bị bỏ sót.
 *
 * Tách thành file riêng trong `features/auth` (không phải `server/`) vì middleware
 * chạy ở edge và `features/**` không được import `@/server`.
 */
const PUBLIC_ROUTES = [
  '/login',
  // Đổi tên thành `/register` vẫn phải private — không còn đăng ký qua form nữa.
  '/api/auth',
  // PWA manifest, không chứa dữ liệu người dùng. Matcher của middleware bỏ qua
  // `.png` chứ không bỏ `.json`, nên nếu không để đây thì `manifest.json` bị chặn.
  '/manifest.json',
] as const

/**
 * Hàm tự bỏ `?query` và `#hash` thay vì bắt người gọi phải làm sẵn.
 *
 * Middleware thật sự truyền `nextUrl.pathname` (đã sạch), nhưng đây là hàm quyết
 * định cái gì được phép đọc dữ liệu — nếu sau này ai đó truyền thẳng `request.url`
 * hoặc `req.nextUrl.href` thì một chữ ký khớp vội là enough để bypass được
 * `/login`. Không để chuyện đó phụ thuộc vào việc ai đó nhớ.
 *
 * So khớp bằng cách `exact` hoặc `route + '/'` để `/loginx` không lọt: so khớp
 * `startsWith('/login')` đơn thuần sẽ coi `/loginx` là public.
 */
export function isPublicRoute(input: string): boolean {
  const pathname = input.split(/[?#]/, 1)[0]

  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  )
}
