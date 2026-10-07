import { test, expect } from '@playwright/test'

/**
 * 1b. Chặn truy cập khi chưa đăng nhập.
 *
 * Chạy trên project `auth-redirect` — server **không** bật `PBL_AUTH_BYPASS`
 * (xem `playwright.config.ts`). Tất cả test kia đều có bypass nên không test nào
 * chứng minh được middleware thật sự chặn; đây là chỗ duy nhất làm được việc đó.
 *
 * Mỗi test phải xong bằng URL `/login`: nếu một trang app render ra được mà không
 * đăng nhập thì chính lỗi đó cần fail.
 */
test.describe('1b. Auth redirect', () => {
  const privatePages = [
    { path: '/tasks', label: 'danh sách task' },
    { path: '/dashboard', label: 'bảng điều khiển' },
    { path: '/habits', label: 'thói quen' },
    { path: '/elearning', label: 'e-learning' },
    { path: '/settings', label: 'cài đặt' },
    { path: '/', label: 'trang chủ' },
  ]

  for (const { path, label } of privatePages) {
    test(`đẩy người chưa đăng nhập ở ${label} về /login`, async ({ page }) => {
      await page.goto(path)

      expect(page.url()).toContain('/login')
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    })
  }

  test('cho truy cập /login mà không cần đăng nhập', async ({ page }) => {
    await page.goto('/login')
    expect(page.url()).not.toContain('/login?')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('manifest vẫn public dù chưa đăng nhập', async ({ request }) => {
    const response = await request.get('/manifest.json')
    expect(response.ok()).toBeTruthy()
  })
})
