# PBL JIT Task Manager — Completion Plan (Phase 0–6)

**Epic key:** `PBLJIT`
**Branch:** `feature/completion-2026-10`
**Base:** `66c190a` (main)
**Created:** 2026-10-03

## Context

`WEB-001`–`WEB-017` (plan `pbl-jit-web-monorepo-plan.md`) đã hoàn thành: 21 commits, 387 unit tests,
28 E2E, branch coverage 92.34%, tsc sạch, build sạch. **Nhưng audit sâu sau đó phát hiện sản phẩm chưa
dùng được:** UI `/tasks` không gọi server action (thao tác không lưu), E2E tasks rỗng, middleware chỉ
chặn `/dashboard`, login là stub, không có database thật, không có user scoping.

Plan này đóng các lỗ hổng đó. **Không deploy** — local trước.

## Spec / binding authority

Không có file spec riêng. **Ledger + rulings của plan `pbl-jit-web-monorepo-plan.md`** là binding
authority cho hành vi domain hiện có. Các ruling sau phải giữ nguyên khi port sang Drizzle:

- Calendar Day view = timeline theo giờ.
- Reminder repeat giữ **giờ gốc**, bỏ qua các kỳ đã trôi qua (`nextOccurrence`).
- Smart-list và dashboard thống nhất định nghĩa overdue.
- `myDayAt` là ngày "làm hôm nay", tách khỏi `dueAt`.
- E-learning dedupe theo `source + externalId`; fallback `source + title + dueAt`.
- Matrix dùng native HTML5 drag-and-drop (không thư viện).

## Global Constraints

- **TDD bắt buộc.** Không production code nào không có test đã fail trước đó.
- Coverage threshold: branches **90%**, statements/lines/functions **80%**. Không giảm.
- Không thêm dependency mà chưa kiểm tra đã có sẵn trong lockfile hoặc registry.
- Mọi server action validate input bằng Zod **server-side** (không tin client).
- Không log PII (email, phone, password, token) vào log/test output.
- `.env.local` là gitignored; chỉ commit `.env.example` với placeholder.
- Test không được chạy network thật; PGlite là Postgres nhúng WASM, chạy offline.
- Commit message tiếng Việt, prefix `feat|fix|refactor|test|docs|ci|chore(scope):`.

## Task list

| # | Phase | Nội dung |
|---|-------|----------|
| 1 | 0 | Sửa mock checklist stale + đảo chiều dependency stats |
| 2 | 0 | DB scripts (`db:generate/migrate/reset`) + migration runner thật |
| 3 | 1 | Nối callbacks UI `/tasks` (create/toggle/delete/update/quadrant/calendar) |
| 4 | 1 | Folder + List management (server actions + UI) |
| 5 | 1 | Subtask + Checklist (server actions + UI) |
| 6 | 1 | E2E tasks thật, thay test rỗng |
| 7 | 2 | Schema `users` + cột `userId` trên các bảng gốc |
| 8 | 2 | PGlite client + driver switch `PBL_DB_DRIVER` |
| 9 | 2 | Migration runner chạy thật trên PGlite |
| 10 | 3 | Drizzle repository: tasks, folders, lists, checklists + `reposFor(userId)` |
| 11 | 3 | Drizzle repository: habits, focus, reminders, e-learning + preferences |
| 12 | 3 | Test chống IDOR (user A không đọc được data user B) |
| 13 | 4 | Đăng nhập Google-only: upsert user theo email + session.userId |
| 14 | 4 | Sửa middleware bảo vệ toàn bộ route (trừ public) |
| 15 | 5 | Calendar Week view + Month view + navigation |
| 16 | 6 | GitHub Actions CI |

## Task 1 — Phase 0: mock checklist + dependency inversion

**Goal:** test suite phản ánh đúng interface thật; `src/features/dashboard` không import server layer.

Files:
- `apps/web/src/server/actions/__tests__/actions.test.ts`
- `apps/web/src/features/dashboard/stats.ts`
- `apps/web/src/features/dashboard/dashboard-types.ts` (mới, hoặc tách vào `stats-types.ts`)

Steps:
1. Test đọc interface `ChecklistRepository` thật, assert `create`/`listByTask` tồn tại và `addItem`/`listForTask` không tồn tại.
   **Expected:** FAIL (`addItem` không nằm trong interface).
2. Sửa mock trong `actions.test.ts` sang `create`/`listByTask`/`setDone`/`remove`.
   **Expected:** PASS.
3. Test assert `src/features/dashboard/stats.ts` không import từ `src/server`.
   **Expected:** FAIL (import `TaskStats` từ server types).
4. Tạo types file trong `features/dashboard`, cập nhật import.
   **Expected:** PASS.
5. `pnpm --filter web test:run` xanh.
   Commit: `refactor(db): sửa mock checklist stale và đảo chiều dependency dashboard`

## Task 2 — Phase 0: DB scripts + migration runner

**Goal:** `pnpm db:migrate` thật sự tạo bảng trên Postgres.

Files:
- `packages/db/scripts/migrate.ts`
- `packages/db/package.json`, `/mnt/Nigga/Hoc_Tap/PBL/package.json`
- `packages/db/src/client.ts`

Steps:
1. Test: import `migrate.ts`, gọi `runMigrations(db)` với PGlite in-memory, assert bảng `folders` tồn tại trong `information_schema`.
   **Expected:** FAIL (module chưa export / là stub).
2. Viết `runMigrations(db)` dùng `drizzle-orm/pglite/migrator`.
   **Expected:** PASS.
3. Thêm script `db:generate` (`drizzle-kit generate`), `db:migrate`, `db:reset` ở root + `packages/db`.
4. Verify: `pnpm db:generate && pnpm db:migrate` không lỗi.
   Commit: `feat(db): migration runner thật cho PGlite và scripts db:*`

## Task 3 — Phase 1: nối callbacks UI `/tasks`

**Goal:** tạo/xoá/toggle task trên web phải persist.

Files:
- `apps/web/app/(app)/tasks/page.tsx`
- `apps/web/src/features/tasks/task-list.tsx`
- `apps/web/src/features/tasks/*.tsx`
- `apps/web/src/server/actions/task-actions.ts`

Steps:
1. Test (`tasks-page.test.tsx`): render page + bấm "Thêm", assert `createTask` được gọi đúng payload.
   **Expected:** FAIL (page không truyền `onCreate`).
2. Wire `onCreate`/`onToggle`/`onDelete`/`onUpdate`/`onQuadrantChange`/`onScheduleToCalendar` vào `TaskList`, dùng `useTransition` + `revalidatePath`.
   **Expected:** PASS.
3. Test: toggle optimistic → `setTaskDone` được gọi, UI đổi trạng thái.
   **Expected:** PASS.
4. Test: lỗi server → hiện `Alert`, task không mất.
   **Expected:** PASS.
5. Suite xanh.
   Commit: `fix(tasks): nối server actions vào UI, thao tác giờ persist`

## Task 4 — Phase 1: folder + list

**Goal:** tạo/sửa/xoá folder và list từ UI.

Files:
- `apps/web/src/server/actions/folder-list-actions.ts` (mới)
- `apps/web/src/features/tasks/folder-list-panel.tsx` (mới)
- `apps/web/app/(app)/tasks/page.tsx`
- `apps/web/src/server/repositories/folder-list-repository.ts`

Steps:
1. Test actions: `createFolder` tạo thành công; tạo trùc tên trong cùng scope → lỗi.
   **Expected:** FAIL (module chưa có).
2. Viết actions `createFolder/renameFolder/deleteFolder/createList/renameList/deleteList` + Zod.
   **Expected:** PASS.
3. Test UI: chọn folder → task list lọc đúng.
   **Expected:** FAIL (chưa có panel).
4. Viết panel + nối filter.
   **Expected:** PASS.
5. Suite xanh.
   Commit: `feat(tasks): quản lý folder và list trên UI`

## Task 5 — Phase 1: subtask + checklist

**Goal:** mở chiếc task, thêm subtask và checklist item.

Files:
- `apps/web/src/server/actions/checklist-actions.ts` (mới)
- `apps/web/src/server/actions/subtask-actions.ts` (mới)
- `apps/web/src/features/tasks/task-detail-panel.tsx` (mới)

Steps:
1. Test actions checklist: `addChecklistItem` gọi repo `create` (không phải `addItem`).
   **Expected:** FAIL (module chưa có).
2. Viết actions + panel, toggle item gọi `setDone`.
   **Expected:** PASS.
3. Test subtask: thêm subtask tạo task con với `parentTaskId`.
   **Expected:** FAIL.
4. Viết subtask actions.
   **Expected:** PASS.
5. Suite xanh.
   Commit: `feat(tasks): subtask và checklist trên task detail panel`

## Task 6 — Phase 1: E2E tasks thật

**Goal:** E2E chứng minh task được tạo và persist.

Files:
- `apps/web/e2e/02-tasks.spec.ts`

Steps:
1. Sửa E2E: điền form, submit, assert tên task xuất hiện và còn lại sau reload.
   **Expected:** FAIL (task không persist — bug Phase 0 đã sửa thì pass, phải xác nhận fail trước fix hoặc chứng minh bằng test khác).
2. Thêm case toggle done, delete, folder filter.
   **Expected:** PASS.
3. Chạy toàn bộ E2E.
   **Expected:** 28+n pass.
   Commit: `test(e2e): thay test tasks rỗng bằng assertions persist thật`

## Task 7 — Phase 2: schema users + userId

**Goal:** có bảng `users`, mọi bảng gốc có `userId`.

Files:
- `packages/db/src/schema.ts`

Steps:
1. Test schema: export `users` có `emailUniqueIndex`, `phoneUniqueIndex`; mọi bảng gốc có `userId` không null.
   **Expected:** FAIL (chưa có).
2. Thêm `users`, thêm cột `userId` + index + FK.
   **Expected:** PASS.
3. `pnpm db:generate` sinh migration mà không lỗi.
   **Expected:** PASS.
4. Suite xanh.
   Commit: `feat(db): bảng users và userId trên các bảng gốc`

## Task 8 — Phase 2: PGlite client + driver switch

**Goal:** app đọc/ghi Postgres thật khi chạy local.

Files:
- `packages/db/src/client.ts`
- `apps/web/next.config.mjs`

Steps:
1. Test: `getDb({ driver: 'pglite', dataDir })` trả về db PGlite, `getDb({ driver: 'pg', url })` trả về node-postgres.
   **Expected:** FAIL.
2. Cài `@electric-sql/pglite` + `pg`, viết client singleton, `PBL_DB_DRIVER` chọn driver.
   **Expected:** PASS.
3. Thêm `serverExternalPackages: ['@electric-sql/pglite', 'pg']`.
   **Expected:** PASS.
4. Test tích hợp: insert + select qua `getDb` thật.
   **Expected:** PASS.
   Commit: `feat(db): PGlite client với driver switch pglite|pg`

## Task 9 — Phase 2: migration chạy trên app

**Goal:** `dev` tự migrate, seed user mặc định tạm thời.

Files:
- `packages/db/scripts/migrate.ts`, `packages/db/scripts/seed.ts` (mới)
- `apps/web/instrumentation.ts` (mới)

Steps:
1. Test: `seed()` idempotent, chạy 2 lần không duplicate.
   **Expected:** FAIL.
2. Viết `seed` tạo dev user + folder/list mẫu.
   **Expected:** PASS.
3. `instrumentation.ts` gọi migrate + seed khi `NODE_ENV !== 'production'`.
   **Expected:** PASS.
4. Verify `pnpm dev` log không còn `MissingSecret`.
   **Expected:** PASS.
   Commit: `feat(db): auto-migrate và seed khi khởi động dev`

## Task 10 — Phase 3: repository tasks/folders/lists/checklists

**Goal:** 4 repository đầu chuyển từ in-memory sang Drizzle, scope theo user.

Files:
- `packages/db/src/repositories/task-repository.ts` (mới)
- `packages/db/src/repositories/folder-list-repository.ts` (mới)
- `packages/db/src/repositories/checklist-repository.ts` (mới)
- `apps/web/src/server/repositories/index.ts`

Steps:
1. Test contract: chạy cùng bộ test lên cả in-memory và Drizzle repo, kết quả phải giống nhau.
   **Expected:** FAIL (Drizzle repo chưa có).
2. Viết repo Drizzle giữ nguyên interface `apps/web/src/server/repositories/*`.
   **Expected:** PASS.
3. Thay `getRepos()` bằng `reposFor(userId)`; mọi query filter `userId`.
   **Expected:** PASS.
4. Tất cả call site cập nhật.
   **Expected:** PASS (tsc sạch).
   Commit: `refactor(db): Drizzle repository cho tasks/folders/lists/checklists, scope theo user`

## Task 11 — Phase 3: repository habits/focus/reminders/e-learning

Steps giống Task 10 cho 4 domain còn lại + `preferences`.

1. Test contract cho từng domain.
   **Expected:** FAIL.
2. Viết repo.
   **Expected:** PASS.
3. Xanh + tsc sạch.
   Commit: `refactor(db): Drizzle repository cho habits/focus/reminders/e-learning`

## Task 12 — Phase 3: test chống IDOR

Files:
- `apps/web/src/server/repositories/__tests__/idor.test.ts` (mới)

Steps:
1. Test: user B `getTask(taskA)` → `null`; `listTasks()` không chứa task A; `deleteTask(taskA)` → `false`.
   **Expected:** FAIL nếu repo chưa scope; PASS nếu đã scope (test bảo vệ regression).
2. Thêm test cho checklist, reminders, habits, e-learning.
   **Expected:** PASS.
3. Nếu có fail → sửa repo cho khi nào xanh.
   Commit: `test(db): chặn IDOR giữa hai user`

## Task 13 — Phase 4: đăng nhập Google (thay thế sĐT/mật khẩu)

User chốt giữa chừng: **bỏ toàn bộ sĐT + mật khẩu, chỉ đăng nhập bằng Google**.
Lần đăng nhập đầu tự tạo user, ai có Google account cũng vào được. Session = JWT
(giữ nguyên). Chưa có `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET` → test bằng mock,
luồng OAuth thật không verify được.

Files:
- `packages/db/src/schema.ts` + migration (drizzle-kit generate)
- `apps/web/src/server/users.ts` (mới): `findOrCreateUserByEmail`
- `apps/web/src/auth.ts` (callback `jwt`/`session`)
- `apps/web/src/types/next-auth.d.ts` (mới): augment `Session.userId`/`JWT.userId`
- `apps/web/src/server/current-user.ts`
- `apps/web/app/login/page.tsx`

Steps:
1. Test schema: users không còn `phone`/`password_hash`, `email` NOT NULL + unique.
   **Expected:** FAIL.
2. Sửa schema + `pnpm --filter @pbl/db generate` → migration 0003 (drop
   `users_phone_unique`, drop `phone`/`password_hash`, `email` SET NOT NULL).
   **Expected:** PASS. Chú ý `reset.test.ts` chèn user thiếu email → thêm email.
3. Test `findOrCreateUserByEmail`: tạo mới; idempotent; normalize trim+lower;
   race song song cùng email → 1 user; không ghi đè name/avatar; email rỗng → throw.
   **Expected:** FAIL.
4. Viết `findOrCreateUserByEmail` (insert `onConflictDoNothing` + select lại).
   **Expected:** PASS.
5. `auth.ts`: callback `jwt` upsert user theo email (khi `user` có mặt) → gán
   `token.userId`; callback `session` map `session.userId = token.userId`.
   **Expected:** PASS.
6. `currentUserId()`: thứ tự session (`session.userId`) → bypass dev (`PBL_AUTH_BYPASS`)
   → fail closed. Test session path + bypass path + production.
   **Expected:** PASS.
7. Login page: form server-action `signIn("google", { redirectTo: "/dashboard" })`,
   nút "Tiếp tục với Google". Test render.
   **Expected:** PASS.
8. Suite xanh (typecheck, tests, coverage, build, E2E 41/41).
   Commit: `feat(auth): đăng nhập Google — upsert user theo email, session.userId`

## Task 14 — Phase 4: sửa middleware

Files:
- `apps/web/src/auth.config.ts`

Steps:
1. Test `isPublicRoute`: `/login`, `/auth`, `/manifest.json` public; `/tasks`, `/calendar`, `/dashboard`, `/` private.
   **Expected:** FAIL (rule `/(app)` sai).
2. Viết `isPublicRoute` theo allowlist explicit.
   **Expected:** PASS.
3. Test: không session vào `/tasks` → redirect `/login`; có session vào `/login` → redirect `/dashboard`.
   **Expected:** PASS.
4. E2E: unauthenticated visit `/tasks` bị redirect.
   **Expected:** PASS.
5. Xanh.
   Commit: `fix(auth): middleware bảo vệ mọi route private thay vì chỉ /dashboard`

### Wiring Google OAuth thật (hoàn tất sau Task 13/14)

Có credential thật từ `pass.txt` (gitignored). User chốt: `https://localhost:5678` là
base dev, consent Google đang ở **Testing** (publish sau).

- Auth.js (v0.41.3) **không cho đổi layout** redirect URI — luôn là
  `<origin><basePath>/callback/<provider>` (hardcode `lib/utils/providers.js`; `merge`
  ghi đè `callbackUrl`). URI user đưa (`/auth/google/callback`) không tạo được → chọn
  `basePath: '/auth'` và URI chuẩn **`https://localhost:5678/auth/callback/google`**.
- `AUTH_URL` quyết định origin (qua `reqWithEnvURL`) → dev phải chạy HTTPS ở 5678:
  `next dev --experimental-https -p 5678` (mkcert; cần sudo password 1 lần).
- Route handler chuyển `app/api/auth/[...nextauth]` → `app/auth/[...nextauth]`;
  allowlist `/api/auth` → `/auth`.
- `.env.local`: `AUTH_URL=https://localhost:5678`, `AUTH_GOOGLE_ID/SECRET`, `PBL_AUTH_BYPASS=false`.
- Đã verify ở mức URL: POST `/auth/signin/google` → 302 tới accounts.google.com với
  `redirect_uri=https://localhost:5678/auth/callback/google` (PKCE S256).
- **Việc còn lại ngoài code**: user phải sửa URI trong Google Console thành
  `https://localhost:5678/auth/callback/google` rồi đăng nhập bằng 1 account test.
- E2E vẫn override `AUTH_URL` theo port (127.0.0.1:3100/3101) nên không bị ảnh hưởng.

## Task 15 — Phase 5: calendar week + month

Files:
- `apps/web/src/features/calendar/week-view.tsx` (mới)
- `apps/web/src/features/calendar/month-view.tsx` (mới)
- `apps/web/src/features/calendar/calendar-view.tsx`
- `apps/web/app/(app)/calendar/page.tsx`

Steps:
1. Test week view: 7 cột × 24 slot, task đúng ngày đúng giờ, prev/next tuần.
   **Expected:** FAIL.
2. Viết `week-view`.
   **Expected:** PASS.
3. Test month view: lưới 6×7, chip theo ngày, click ngày → day view, prev/next tháng.
   **Expected:** FAIL.
4. Viết `month-view`.
   **Expected:** PASS.
5. Nối navigation + truyền `draggableTaskId`; thay placeholder.
   **Expected:** PASS.
6. E2E: chuyển Week, drop task vào slot → task nhảy sang giờ đó.
   **Expected:** PASS.
   Commit: `feat(calendar): hoàn thiện week view, month view và navigation`

## Task 16 — Phase 6: GitHub Actions CI

Files:
- `.github/workflows/ci.yml` (mới)
- `/mnt/Nigga/Hoc_Tap/PBL/README.md`

Steps:
1. Test (`ci.test.ts`): parse YAML, assert có jobs install/typecheck/test/e2e/build, `pull_request` + `push` triggers, không có `deploy`.
   **Expected:** FAIL (chưa có file).
2. Viết `ci.yml`: pnpm 9.15.9, Node 24, cache, drizzle-kit generate, tsc, test:run, playwright chromium, build.
   **Expected:** PASS.
3. Workflow phải chạy được **không cần secret**: dùng secret tạm cho `AUTH_SECRET` ở step test.
   **Expected:** PASS.
4. Thêm badge CI vào README.
   **Expected:** PASS.
5. Local verify: chạy lại từng step của workflow.
   **Expected:** PASS.
   Commit: `ci: GitHub Actions chạy typecheck, test, E2E và build`