import { test, expect } from '@playwright/test'

test.describe('6. Habits, streak, heatmap', () => {
  test('creates a habit', async ({ page }) => {
    await page.goto('/habits')
    await page.getByLabel(/tên thói quen/i).fill('Uống nước 2L')
    await page.getByRole('button', { name: /thêm/i }).click()
    await expect(page.getByText('Uống nước 2L')).toBeVisible()
  })

  test('checks in a habit and updates the streak', async ({ page }) => {
    await page.goto('/habits')
    const habitButton = page.getByRole('button', { name: 'Uống nước 2L' })
    await expect(habitButton).toHaveAttribute('aria-pressed', 'false')
    await habitButton.click()
    await expect(page.getByRole('button', { name: 'Uống nước 2L' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  test('renders the 12 week heatmap cells', async ({ page }) => {
    await page.goto('/habits')
    await expect(page.getByTestId(/heat-cell-/).first()).toBeVisible()
  })

  test('rejects an empty habit name', async ({ page }) => {
    await page.goto('/habits')
    await page.getByLabel(/tên thói quen/i).fill('   ')
    await page.getByRole('button', { name: /thêm/i }).click()
    await expect(page.getByText(/tên thói quen là bắt buộc/i).first()).toBeVisible()
  })
})
