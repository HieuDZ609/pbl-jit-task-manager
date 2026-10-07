/**
 * Đường tắt xác thực — dùng chung cho dev local và E2E.
 *
 * Một cờ duy nhất (`PBL_AUTH_BYPASS`) đọc ở **cả** middleware (callback
 * `authorized`) lẫn `currentUserId()`. Hai chỗ dùng chung một cờ là chủ đích: nếu
 * lệch điều kiện ở một chỗ thì middleware cho vào nhưng `currentUserId()` vẫn
 * ném lỗi — hoặc tệ hơn, middleware chặn mà `currentUserId()` vẫn trả user dev
 * nên dữ liệu bị gán sai người.
 *
 * Vô hiệu hoàn toàn ở production: không thể bật bằng env var trên máy deploy
 * được, vì `NODE_ENV` đã kẹp sẵn.
 *
 * Khi có `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET` thật thì xoá cờ này khỏi
 * `.env.local` để dùng luồng đăng nhập Google; không xoá thì vẫn vào thẳng app
 * không qua login.
 */
export function isAuthBypassEnabled(): boolean {
  return process.env.NODE_ENV !== 'production' && process.env.PBL_AUTH_BYPASS === 'true'
}
