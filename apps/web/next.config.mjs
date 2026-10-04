/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@pbl/db', '@pbl/types', '@pbl/validators'],
  // PGlite là WASM/native, `pg` là native binding. Đóng gói chúng vào server
  // bundle làm hỏng đường dẫn fs/worker lúc runtime, không lỗi lúc build:
  // PGlite tự `fs.readFile(URL)` để nạp wasm, mà `URL` sinh ra trong bundle của
  // webpack không được `fs` của Node nhận ⇒ ERR_INVALID_ARG_TYPE lúc chạy.
  //
  // `serverExternalPackages` chỉ externalize được package mà Next **resolve
  // được từ app**. Với pnpm (node_modules nghiêm ngặt) app không thấy
  // `@electric-sql/pglite`/`pg` vì chúng là dependency của `@pbl/db`, nên Next
  // đóng gói chúng và hỏng runtime. Vì vậy hai package này còn phải là
  // dependency trực tiếp của `web` — đừng gỡ, dù code app không import.
  serverExternalPackages: ['@electric-sql/pglite', 'pg'],
}

export default nextConfig
