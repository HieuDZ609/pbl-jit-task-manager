import path from 'node:path'

import { defineConfig, devices } from '@playwright/test'

const PORT = Number(process.env.E2E_PORT ?? 3100)
const AUTH_PORT = Number(process.env.E2E_AUTH_PORT ?? 3101)

/**
 * Port thứ hai cho server **không** bật bypass.
 *
 * Mọi test E2E đang dùng được thì toàn bộ app đều chạy qua `PBL_AUTH_BYPASS`, nên
 * không test nào chứng minh được middleware thật sự chặn. Server này là nơi duy
 * nhất kiểm chứng được "chưa đăng nhập vào `/tasks` thì bị đẩy về `/login`".
 *
 * **Bắt buộc** set `PBL_AUTH_BYPASS: 'false'` tường minh, đừng tưởng "không set
 * tức là tắt": `.env.local` (gitignored) có `PBL_AUTH_BYPASS=true` và `next dev`
 * tự nạp nó — env có sẵn trong `process.env` mới thắng `.env.local`, nên phải đưa
 * giá trị `'false'` vào `process.env` từ trước khi Next khởi động.
 */

/**
 * E2E dùng data dir riêng, không đụng `packages/db/.pglite` của dev.
 *
 * Từ Task 10 app đọc/ghi DB thật, nên nếu E2E dùng chung data dir với dev thì
 * mỗi lần chạy để lại dữ liệu và các test đòi trạng thái rỗng (`renders an empty
 * state in each quadrant`) sẽ hỏng tuỳ thứ tự. Xoá dir trước khi chạy để mỗi
 * lần bắt đầu từ trạng thái sạch và migrate+seed tạo đúng dữ liệu mẫu tối thiểu.
 *
 * Hai server chạy song song nên **bắt buộc** hai dir riêng: PGlite giữ lock trên
 * data dir, cùng dir thì server thứ hai mở được và treo.
 *
 * Đường dẫn phải là **tuyệt đối**: `pnpm --filter` chạy script với cwd =
 * `packages/db` còn `next dev` chạy với cwd = `apps/web`, nên đường dẫn tương
 * đối sẽ trỏ hai nơi khác nhau.
 */
const e2eDataDir = path.resolve(__dirname, '../../packages/db/.pglite-e2e')
const e2eAuthDataDir = path.resolve(__dirname, '../../packages/db/.pglite-e2e-auth')

const boot = (port: number, dataDir: string, extraEnv: Record<string, string> = {}) => ({
  command: `rm -rf "${dataDir}" && pnpm --filter @pbl/db migrate && pnpm --filter @pbl/db seed && npx next dev -p ${port}`,
  url: `http://127.0.0.1:${port}`,
  reuseExistingServer: !process.env.CI,
  timeout: 120_000,
  env: {
    PBL_PGLITE_DIR: dataDir,
    // `.env.local` có `AUTH_URL=http://localhost:3000` (next-auth dùng nó để build
    // URL redirect), nhưng E2E chạy ở port 3100/3101 — nếu không override thì
    // middleware redirect về localhost:3000 (không có server) và mọi test vỡ.
    AUTH_URL: `http://127.0.0.1:${port}`,
    ...extraEnv,
  },
})

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['list']],
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: '**/01b-auth-redirect.spec.ts',
    },
    {
      name: 'auth-redirect',
      use: { ...devices['Desktop Chrome'], baseURL: `http://127.0.0.1:${AUTH_PORT}` },
      testMatch: '**/01b-auth-redirect.spec.ts',
    },
  ],
  webServer: [
    boot(PORT, e2eDataDir, { PBL_AUTH_BYPASS: 'true' }),
    boot(AUTH_PORT, e2eAuthDataDir, { PBL_AUTH_BYPASS: 'false' }),
  ],
})
