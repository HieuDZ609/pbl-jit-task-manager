/**
 * Đường tắt xác thực chỉ dành cho E2E: bị vô hiệu hoàn toàn ở production build.
 * Dùng chung cho middleware (authorized callback) và guard trong page để hai
 * nơi không lệch điều kiện — lệch một chỗ là lộ trang không cần đăng nhập.
 */
export function isAuthBypassEnabled(): boolean {
  return process.env.NODE_ENV !== 'production' && process.env.E2E_BYPASS_AUTH === 'true'
}
