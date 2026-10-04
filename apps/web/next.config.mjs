/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@pbl/db', '@pbl/types', '@pbl/validators'],
  // PGlite là WASM/native, `pg` là native binding. Đóng gói chúng vào server
  // bundle làm hỏng đường dẫn fs/worker lúc runtime, không lỗi lúc build.
  serverExternalPackages: ['@electric-sql/pglite', 'pg']
}

export default nextConfig
