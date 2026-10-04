import path from 'node:path'

import { defineConfig, devices } from '@playwright/test'

const PORT = Number(process.env.E2E_PORT ?? 3100)
const baseURL = `http://127.0.0.1:${PORT}`

/**
 * E2E dùng data dir riêng, không đụng `packages/db/.pglite` của dev.
 *
 * Từ Task 10 app đọc/ghi DB thật, nên nếu E2E dùng chung data dir với dev thì
 * mỗi lần chạy để lại dữ liệu và các test đòi trạng thái rỗng (`renders an empty
 * state in each quadrant`) sẽ hỏng tuỳ thứ tự. Xoá dir trước khi chạy để mỗi
 * lần bắt đầu từ trạng thái sạch và migrate+seed tạo đúng dữ liệu mẫu tối thiểu.
 *
 * Đường dẫn phải là **tuyệt đối**: `pnpm --filter` chạy script với cwd =
 * `packages/db` còn `next dev` chạy với cwd = `apps/web`, nên đường dẫn tương
 * đối sẽ trỏ hai nơi khác nhau.
 */
const e2eDataDir = path.resolve(__dirname, '../../packages/db/.pglite-e2e')

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
    baseURL,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `rm -rf "${e2eDataDir}" && pnpm --filter @pbl/db migrate && pnpm --filter @pbl/db seed && npx next dev -p ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: { E2E_BYPASS_AUTH: 'true', PBL_PGLITE_DIR: e2eDataDir },
  },
})
