import { test, expect } from '@playwright/test'

test.describe('3. Eisenhower matrix', () => {
  test('renders all four quadrants', async ({ page }) => {
    await page.goto('/matrix')
    for (const q of ['A', 'B', 'C', 'D']) {
      await expect(page.getByTestId(`quadrant-${q}`)).toBeVisible()
    }
  })

  test('shows the empty state when the matrix has no tasks', async ({ page }) => {
    await page.goto('/matrix')
    await expect(page.getByText(/chưa có việc nào/i)).toBeVisible()
  })
})
