import { test, expect, type Page } from '@playwright/test'

const CSV = [
  'title,type,course,dueAt',
  'Lab 1 E2E,lab,JIT101,2026-11-02',
  'Quiz tuần 3,quiz,JIT101,2026-11-09',
].join('\n')

const ICS = [
  'BEGIN:VCALENDAR',
  'BEGIN:VEVENT',
  'UID:evt-1@jit.school',
  'SUMMARY:Deadline giữa kỳ',
  'DTSTART:20261116T090000Z',
  'END:VEVENT',
  'END:VCALENDAR',
].join('\r\n')

// Repo in-memory là state dùng chung cho cả dev server, nên mỗi test dùng
// tiêu đề riêng để không bị dedupe bởi dữ liệu của test khác.
const csvOf = (...titles: string[]) =>
  ['title,type,course,dueAt', ...titles.map((t) => `${t},lab,JIT101,2026-11-02`)].join('\n')

const imported = (page: Page) => page.getByTestId('elearning-list')

async function importCsv(page: Page, csv: string) {
  await page.getByLabel(/nội dung csv/i).fill(csv)
  await page.getByRole('button', { name: 'Xem trước' }).click()
  await page.getByRole('button', { name: 'Xác nhận nhập' }).click()
  await expect(imported(page)).toBeVisible()
}

test.describe('7. E-learning import + dedupe', () => {
  test('previews CSV rows before confirming', async ({ page }) => {
    await page.goto('/elearning')
    await page.getByLabel(/nội dung csv/i).fill(CSV)
    await page.getByRole('button', { name: 'Xem trước' }).click()

    const preview = page.getByTestId('import-preview')
    await expect(preview).toBeVisible()
    await expect(preview).toContainText('2 bản ghi sẽ được nhập')
    await expect(preview.getByText('Lab 1 E2E')).toBeVisible()
    await expect(preview.getByText('Quiz tuần 3')).toBeVisible()
    await expect(imported(page)).toBeHidden()
  })

  test('confirms the import and lists the items', async ({ page }) => {
    await page.goto('/elearning')
    await importCsv(page, CSV)
    await expect(imported(page).getByText('Lab 1 E2E')).toBeVisible()
    await expect(imported(page).getByText('Quiz tuần 3')).toBeVisible()
  })

  test('parses ICS events', async ({ page }) => {
    await page.goto('/elearning')
    await page.getByRole('button', { name: 'ics' }).click()
    await page.getByLabel(/nội dung ics/i).fill(ICS)
    await page.getByRole('button', { name: 'Xem trước' }).click()
    await expect(page.getByTestId('import-preview')).toContainText('Deadline giữa kỳ')
  })

  test('dedupes a repeated import', async ({ page }) => {
    const csv = csvOf('Bài giảng A', 'Bài giảng B')
    await page.goto('/elearning')
    await importCsv(page, csv)
    await expect(imported(page).getByText('Bài giảng A')).toBeVisible()

    await page.getByLabel(/nội dung csv/i).fill(csv)
    await page.getByRole('button', { name: 'Xem trước' }).click()
    await expect(page.getByTestId('import-preview')).toContainText('2 bản ghi trùng đã bỏ qua')
    await expect(imported(page).getByText('Bài giảng A')).toBeVisible()
  })

  test('reports an error when nothing is valid', async ({ page }) => {
    await page.goto('/elearning')
    await page.getByLabel(/nội dung csv/i).fill('không phải csv')
    await page.getByRole('button', { name: 'Xem trước' }).click()
    await expect(page.getByTestId('import-error')).toContainText(/không tìm thấy bản ghi hợp lệ/i)
  })
})
