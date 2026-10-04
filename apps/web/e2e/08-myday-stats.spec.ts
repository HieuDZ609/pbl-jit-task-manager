import { test, expect } from '@playwright/test'

test.describe('8. My Day + stats', () => {
  test('adds a task to My Day and counts it as remaining', async ({ page }) => {
    await page.goto('/myday')
    await page.getByLabel(/việc hôm nay/i).fill('Chuẩn bị thuyết trình')
    await page.getByRole('button', { name: 'Thêm' }).click()

    await expect(page.getByText('Chuẩn bị thuyết trình')).toBeVisible()
    await expect(page.getByTestId('myday-remaining')).toHaveText('1')
  })

  test('marks a My Day task done and drops the remaining count', async ({ page }) => {
    await page.goto('/myday')
    await expect(page.getByTestId('myday-remaining')).toHaveText('1')
    // Dùng click + expect (auto-retry) thay vì check(): check() assert ngay
    // sau click nên bắt được false negative trước khi server action trả về.
    await page.getByLabel('Chuẩn bị thuyết trình').click()
    await expect(page.getByLabel('Chuẩn bị thuyết trình')).toBeChecked()
    await expect(page.getByTestId('myday-remaining')).toHaveText('0')
  })

  test('ignores a blank My Day title', async ({ page }) => {
    await page.goto('/myday')
    await page.getByLabel(/việc hôm nay/i).fill('   ')
    await page.getByRole('button', { name: 'Thêm' }).click()
    await expect(page.getByText(/hôm nay chưa có việc gì/i)).toBeHidden()
    await expect(page.getByTestId('myday-remaining')).toHaveText('0')
  })

  test('shows completed and focus stats on the dashboard', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByText(/hoàn thành hôm nay/i)).toBeVisible()
    await expect(page.getByText(/phút tập trung/i)).toBeVisible()
  })

  /**
 * Không assert đúng `/1/`: cả spec 02 cũng toggle task done nên số hoàn thành
 * hôm nay tích luỹ theo thứ tự chạy. Chỉ cần chứng minh con số phản ánh task
 * đã hoàn thành, tức lớn hơn 0.
 */
test('reflects the completed task in today stats', async ({ page }) => {
    await page.goto('/dashboard')
    const card = page.getByTestId('stat-completedToday')
    await expect(card).toHaveText(/\d+/)
    const completed = Number((await card.textContent())?.replace(/\D/g, '') ?? '0')
    expect(completed).toBeGreaterThan(0)
  })
})
