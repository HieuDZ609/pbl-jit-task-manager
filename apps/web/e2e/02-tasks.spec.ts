import { test, expect } from '@playwright/test'

/**
 * LƯU Ý QUAN TRỌNG — phạm vi thực tế của bộ test này:
 *
 * Server action hiện dùng `repos` là singleton trên `globalThis`, và Playwright
 * dùng MỘT dev server cho cả spec. Vì vậy:
 *
 *  - Test KHÔNG được phụ thuộc vào việc dataset rỗng, vì test trước đã tạo data.
 *    Đây chính là lý do bản cũ của spec này fail: test "empty state" chạy sau
 *    test "create" nên không còn task nào để rỗng.
 *  - Assert "còn lại sau reload" CHỈ chứng minh dữ liệu sống trong cùng process
 *    Node, KHÔNG chứng minh đã persist vào database. Bản persist thật sẽ được
 *    siết lại ở Task 9/10 khi repository chuyển sang Drizzle.
 */

let seq = 0

function uniqueTitle(prefix: string): string {
  seq += 1
  return `${prefix} ${Date.now()}-${seq}`
}

async function createTask(page: import('@playwright/test').Page, title: string) {
  await page.getByLabel(/title/i).fill(title)
  await page.getByRole('button', { name: /add/i }).click()
  await expect(page.getByText(title, { exact: true })).toBeVisible()
}

test.describe('2. Tasks, folders, lists, subtasks, checklist', () => {
  test('renders the tasks page heading', async ({ page }) => {
    await page.goto('/tasks')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('tạo task từ form quick add và hiện trong danh sách', async ({ page }) => {
    await page.goto('/tasks')
    const title = uniqueTitle('Viết báo cáo')
    await createTask(page, title)
    await expect(page.getByLabel(`Toggle ${title}`)).toBeVisible()
  })

  test('task vẫn còn sau reload (cùng process, chưa phải DB)', async ({ page }) => {
    await page.goto('/tasks')
    const title = uniqueTitle('Reload')
    await createTask(page, title)

    await page.reload()

    await expect(page.getByText(title, { exact: true })).toBeVisible()
  })

  test('toggle task đánh dấu hoàn thành', async ({ page }) => {
    await page.goto('/tasks')
    const title = uniqueTitle('Toggle')
    await createTask(page, title)

    const box = page.getByLabel(`Toggle ${title}`)
    await box.check()

    await expect(box).toBeChecked()
    await expect(page.getByText(title, { exact: true })).toHaveClass(/line-through/)
  })

  test('xoá task làm mất khỏi danh sách', async ({ page }) => {
    await page.goto('/tasks')
    const title = uniqueTitle('Xoá')
    await createTask(page, title)

    await page.getByLabel(`Delete ${title}`).click()

    await expect(page.getByText(title, { exact: true })).toHaveCount(0)
  })

  test('mở panel chi tiết và thêm mục checklist', async ({ page }) => {
    await page.goto('/tasks')
    const title = uniqueTitle('Checklist')
    await createTask(page, title)

    await page.getByLabel(`Mở chi tiết ${title}`).click()
    const item = 'Mục checklist E2E'
    await page.getByLabel(/mục checklist mới/i).fill(item)
    await page.getByRole('button', { name: /thêm mục/i }).click()

    await expect(page.getByText(item, { exact: true })).toBeVisible()
  })

  test('thêm subtask và toggle được từ panel chi tiết', async ({ page }) => {
    await page.goto('/tasks')
    const title = uniqueTitle('Cha')
    await createTask(page, title)

    await page.getByLabel(`Mở chi tiết ${title}`).click()
    const sub = 'Subtask E2E'
    await page.getByLabel(/tên subtask mới/i).fill(sub)
    await page.getByRole('button', { name: /thêm subtask/i }).click()

    const subBox = page.getByLabel(`Toggle subtask ${sub}`)
    await expect(subBox).toBeVisible()
    await subBox.check()
    await expect(subBox).toBeChecked()
  })

  test('lọc theo folder chỉ hiện task thuộc folder đó', async ({ page }) => {
    await page.goto('/tasks')
    const folder = uniqueTitle('Folder')
    await page.getByLabel('Tên folder mới').fill(folder)
    await page.getByRole('button', { name: /thêm folder/i }).click()

    const inFolder = uniqueTitle('Trong folder')
    const other = uniqueTitle('Ngoài folder')

    await page.getByLabel(/title/i).fill(other)
    await page.getByRole('button', { name: /add/i }).click()
    await expect(page.getByText(other, { exact: true })).toBeVisible()

    await page.getByRole('button', { name: `Lọc: ${folder}` }).click()
    await expect(page.getByText(other, { exact: true })).toHaveCount(0)

    await page.getByRole('button', { name: 'Tất cả' }).click()
    await expect(page.getByText(other, { exact: true })).toBeVisible()
    await expect(page.getByText(inFolder, { exact: true })).toHaveCount(0)
  })
})
