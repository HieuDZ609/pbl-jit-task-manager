import { test, expect } from '@playwright/test'

test.describe('4. Calendar time-blocking', () => {
  test('renders the day timeline', async ({ page }) => {
    await page.goto('/calendar')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('renders hour slots', async ({ page }) => {
    await page.goto('/calendar')
    await expect(page.getByTestId('calendar-day').or(page.getByText(/08:00/))).toBeVisible()
  })
})
