import { test, expect } from '@playwright/test'

test.describe('5. Pomodoro + white noise', () => {
  test('starts the timer at 25:00 in work mode', async ({ page }) => {
    await page.goto('/focus')
    await expect(page.getByTestId('mode-label')).toContainText(/tập trung/i)
    await expect(page.getByTestId('timer-display')).toHaveText('25:00')
  })

  test('counts down once started', async ({ page }) => {
    await page.goto('/focus')
    await page.getByRole('button', { name: /bắt đầu/i }).click()
    await expect(page.getByTestId('timer-display')).not.toHaveText('25:00')
  })

  test('reset returns the timer to full duration', async ({ page }) => {
    await page.goto('/focus')
    await page.getByRole('button', { name: /bắt đầu/i }).click()
    await page.getByRole('button', { name: /đặt lại/i }).click()
    await expect(page.getByTestId('timer-display')).toHaveText('25:00')
  })

  test('toggles a white noise sound on and off', async ({ page }) => {
    await page.goto('/focus')
    await expect(page.getByTestId('noise-state')).toContainText(/Tắt/)
    await page.getByRole('button', { name: /mưa/i }).click()
    await expect(page.getByTestId('noise-state')).toContainText(/Đang phát/)
    await page.getByRole('button', { name: /mưa/i }).click()
    await expect(page.getByTestId('noise-state')).toContainText(/Tắt/)
  })
})
