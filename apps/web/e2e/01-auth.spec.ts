import { test, expect } from '@playwright/test'

test.describe('1. Auth', () => {
  test('renders the login page publicly', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('serves the web manifest', async ({ request }) => {
    const response = await request.get('/manifest.json')
    expect(response.ok()).toBeTruthy()
    expect((await response.json()).name).toBeTruthy()
  })

  test('reaches the dashboard through the CI-safe auth bypass', async ({ page }) => {
    // Bypass chỉ hoạt động khi NODE_ENV !== production (xem src/auth.config.ts).
    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: /bảng điều khiển/i })).toBeVisible()
  })
})
