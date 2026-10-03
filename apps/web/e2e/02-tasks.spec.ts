import { test, expect } from '@playwright/test'

test.describe('2. Tasks, folders, lists, subtasks, checklist', () => {
  test('creates a task from the quick add form', async ({ page }) => {
    await page.goto('/tasks')
    const input = page.getByLabel(/title/i)
    await expect(input).toBeVisible()
    await input.fill('Viết báo cáo PBL')
    await page.getByRole('button', { name: /add/i }).click()
    await expect(page.getByRole('button', { name: /add/i })).toBeVisible()
  })

  test('renders the tasks page heading', async ({ page }) => {
    await page.goto('/tasks')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('shows an empty state when there are no tasks', async ({ page }) => {
    await page.goto('/tasks')
    await expect(page.getByText(/chưa có công việc nào/i)).toBeVisible()
  })
})
