import { test, expect } from '@playwright/test'

const E2E_TASK = 'Task mẫu lịch E2E'

function todayKey(d = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

test.describe('4. Calendar time-blocking', () => {
  test('renders the day timeline', async ({ page }) => {
    await page.goto('/calendar')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('renders hour slots', async ({ page }) => {
    await page.goto('/calendar')
    await expect(page.getByText(/08:00/)).toBeVisible()
  })

  test('switches to week view with a 7-column grid', async ({ page }) => {
    await page.goto('/calendar')
    await page.getByRole('button', { name: /tuần/i }).click()
    await expect(page.getByTestId(`week-col-${todayKey()}`)).toBeVisible()
    await expect(page.getByText('T2')).toBeVisible()
    await expect(page.getByText('CN')).toBeVisible()
  })

  test('drops a blocked task onto another slot in the week → task jumps to that hour', async ({
    page,
  }) => {
    // Seed (PBL_E2E_CALENDAR_TASK=1) tuỳ biến đã điều trước: task blocked lúc 09:00 hôm nay.
    await page.goto('/calendar')
    await page.getByRole('button', { name: /tuần/i }).click()

    const key = todayKey()
    const fromSlot = page.getByTestId(`week-slot-${key}-9`)
    await expect(fromSlot.getByText(E2E_TASK, { exact: true })).toBeVisible()

    await fromSlot.getByText(E2E_TASK, { exact: true }).dragTo(page.getByTestId(`week-slot-${key}-14`))

    // Revalidate có thể giữ view (week) hoặc rơi về day — chấp nhận cả hai.
    await expect(
      page.getByTestId(`week-slot-${key}-14`).or(page.getByTestId('slot-14')),
    ).toContainText(E2E_TASK)
    await expect(
      page.getByTestId(`week-slot-${key}-9`).or(page.getByTestId('slot-9')),
    ).not.toContainText(E2E_TASK)
  })
})