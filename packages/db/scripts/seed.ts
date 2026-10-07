import { pathToFileURL } from 'node:url'

import { and, eq, or } from 'drizzle-orm'
import type { PgliteDatabase } from 'drizzle-orm/pglite'

import * as schema from '../src/schema'
import { folders, lists, tasks, users } from '../src/schema'

/**
 * Seed nhận db có schema đầy đủ, giống hệt cách app dựng client
 * (`drizzle(client, { schema })`) — nhờ vậy truy vấn ở đây cũng được
 * kiểu hoá và không phải ép `any`.
 */
type SeedDb = PgliteDatabase<typeof schema>

export const DEV_USER_EMAIL = 'dev@pbl.local'
export const DEV_FOLDER_NAME = 'Công việc'
export const DEV_LIST_NAME = 'Việc hôm nay'
/** Task blocked 09:00 hôm nay chỉ dành cho E2E calendar — bật bằng env. */
export const E2E_CALENDAR_TASK_TITLE = 'Task mẫu lịch E2E'

export type SeedResult = {
  userId: string
  /** Số bản ghi mới tạo ở mỗi bước — dùng để test idempotency. */
  created: { users: number; folders: number; lists: number }
}

/**
 * Seed dữ liệu mẫu cho dev. Idempotent: chạy lại bao nhiêu lần cũng không nhân
 * bản và không ghi đè dữ liệu người dùng đã sửa. Dev server gọi hàm này mỗi
 * lần khởi động nên tính idempotent là bắt buộc, không phải tuỳ chọn.
 */
export async function seed(db: SeedDb): Promise<SeedResult> {
  const created = { users: 0, folders: 0, lists: 0 }

  let user = await findUser(db)
  if (user === null) {
    const [row] = await db
      .insert(users)
      .values({ email: DEV_USER_EMAIL, name: 'Dev User' })
      .returning()
    user = row
    created.users += 1
  }

  let folder = await db
    .select()
    .from(folders)
    .where(eq(folders.userId, user!.id))
    .then((rows) => rows.find((f) => f.name === DEV_FOLDER_NAME) ?? null)
  if (folder === null) {
    const [row] = await db
      .insert(folders)
      .values({ userId: user!.id, name: DEV_FOLDER_NAME })
      .returning()
    folder = row
    created.folders += 1
  }

  const existingList = await db
    .select()
    .from(lists)
    .where(or(eq(lists.userId, user!.id), eq(lists.name, DEV_LIST_NAME)))
    .then((rows) => rows.find((l) => l.name === DEV_LIST_NAME && l.folderId === folder!.id) ?? null)
  if (existingList === null) {
    await db.insert(lists).values({ userId: user!.id, folderId: folder.id, name: DEV_LIST_NAME })
    created.lists += 1
  }

  if (process.env.PBL_E2E_CALENDAR_TASK === '1') {
    await seedE2eCalendarTask(db, user!.id)
  }

  return { userId: user!.id, created }
}

/**
 * Bật bằng `PBL_E2E_CALENDAR_TASK=1` (chỉ webServer E2E chromium của
 * playwright.config.ts). E2E cần một task ĐÃ được block (có `startAt`) để kéo
 * chip trong Week view — app không có UI nào tạo startAt từ đầu. Dev không đặt
 * env nên không bị ảnh hưởng. Idempotent.
 */
async function seedE2eCalendarTask(db: SeedDb, userId: string) {
  const existing = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(and(eq(tasks.userId, userId), eq(tasks.title, E2E_CALENDAR_TASK_TITLE)))
  if (existing.length > 0) return

  const start = new Date()
  start.setHours(9, 0, 0, 0)
  await db.insert(tasks).values({
    userId,
    title: E2E_CALENDAR_TASK_TITLE,
    startAt: start,
    dueAt: new Date(start.getTime() + 30 * 60_000),
  })
}

async function findUser(db: SeedDb) {
  return db
    .select()
    .from(users)
    .where(eq(users.email, DEV_USER_EMAIL))
    .then((rows) => rows[0] ?? null)
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { closeDb, getDb } = await import('../src/client')
  try {
    const result = await seed(getDb())
    console.log(`seed: xong (user ${result.userId}, tạo mới ${JSON.stringify(result.created)})`)
  } finally {
    // Bắt buộc: PGlite giữ event loop (WASM + fs worker). Không đóng thì tiến
    // trình treo vĩnh viễn sau khi in kết quả — `pnpm migrate && next dev` sẽ
    // không bao giờ chạy tới bước sau.
    await closeDb()
  }
}
