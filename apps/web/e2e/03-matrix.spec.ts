import { test, expect } from '@playwright/test'

test.describe('3. Eisenhower matrix', () => {
  test('renders all four quadrants', async ({ page }) => {
    await page.goto('/matrix')
    for (const q of ['A', 'B', 'C', 'D']) {
      await expect(page.getByTestId(`quadrant-${q}`)).toBeVisible()
    }
  })

  /**
 * Lưu ý: empty state cấp ma trận chỉ hiện khi `tasks.length === 0`
 * (xem `matrix-grid.tsx`). Task tạo ở spec 02 có `eisenhowerQuadrant: null`
 * nên vẫn làm dataset khác rỗng → assert empty state toàn cục sẽ phụ thuộc
 * thứ tự chạy. Ở đây ta assert empty state theo từng quadrant, thứ vốn luôn
 * xác định vì không spec E2E nào gán quadrant cho task.
 */
  test('shows an empty state in each quadrant', async ({ page }) => {
    await page.goto('/matrix')
    await expect(page.getByText(/chưa có công việc/i)).toHaveCount(4)
  })
})
