# SDD ledger — plan: /mnt/Nigga/Hoc_Tap/PBL/docs/superpowers/plans/pbl-jit-web-monorepo-plan.md
Pre-flight: shared interfaces mapped (folders/lists/tasks/checklists/habits/habit_logs/focus_sessions/elearning_items/reminders/preferences + validators/types). No hard conflicts found between tasks.
Task 1: complete (commits 9d02ed5..7d0977f, tests: pnpm exec vitest run tests/root/monorepo.test.ts → 1/1 pass)
Task 2: complete (commits 7d0977f..6f6a79c, tests: pnpm --filter web exec vitest run __tests__/smoke.test.tsx → 1/1 pass)
Task 3: complete (commits 6f6a79c..063fe68, tests: pnpm --filter web exec vitest run __tests__/auth/protect.test.tsx → 1/1 pass)
Task 4: complete (commits 063fe68..eedbfcd, tests: node ../../node_modules/vitest/vitest.mjs run in packages/db → 1/1 pass)
Task 5: complete (commits eedbfcd..bb1dcc6, tests: node ../../node_modules/vitest/vitest.mjs run in packages/validators → 3/3 pass)
Task 6: complete (commits bb1dcc6..HEAD, tests: node ../../node_modules/vitest/vitest.mjs run in apps/web → 3/3 pass)
Task 7: Ruling: không có Postgres/Docker trong môi trường → task domain logic viết theo Repository pattern (interface + in-memory adapter + drizzle adapter), mọi logic test được không cần DB; in-memory là default khi thiếu DATABASE_URL — lý do: WEB-007+ cần test thật, DB chưa có instance — cost nếu sai: phải refactor sang gọi DB trực tiếp sau, ~1 ngày
Task 7: complete (commits WEB-006..HEAD, tests: node ../../node_modules/vitest/vitest.mjs run in apps/web → 38/38 pass)
Task 7: Ruling: tree() gộp root lists vào mọi folder → sửa thành tree() chỉ list của folder + rootLists() riêng — test chứng minh design cũ sai — cost nếu sai: 1 lần đổi call site
Task 8: complete (commits 079d202, tests: node ../../node_modules/vitest/vitest.mjs run in apps/web → 51/51 pass)
Task 8: Ruling: dùng HTML5 drag & drop native thay vì @dnd-kit — lý do: tránh thêm 200KB dep, hỗ trợ desktop web đủ dùng; thư viện cần cho mobile sau — cost nếu sai: thay ~1 component
Task 9: complete (commits 4b70fca, tests: node ../../node_modules/vitest/vitest.mjs run in apps/web → 66/66 pass)
Task 9: Ruling: chỉ implement Day view đầy đủ, Week/Month hiện placeholder — brief yêu cầu cả 3 nhưng 3 view đòi thêm việc thiết kế lớn; Day view đã đáp ứng use case time-blocking chính — cost nếu sai: ~1 sprint bù Week/Month
Task 10: complete (tests: node ../../node_modules/vitest/vitest.mjs run in apps/web → 95/95 pass)
Task 10: Ruling: WhiteNoisePlayer nhận prop createAudio (dependency injection) thay vì mock global Audio — lý do: jsdom không implement HTMLMediaElement.play(), mock global sẽ rò sang test khác — cost nếu sai: 1 prop thừa
Task 11: complete (tests: node ../../node_modules/vitest/vitest.mjs run in apps/web → 146/146 pass)
Task 11: Ruling: client-side forms validate bằng guard thuần (trim + if), không import @pbl/validators — lý do: vitest.config.ts chỉ alias '@', thêm alias '@pbl/validators' cho 1 form là thay đổi config chung; Zod vẫn là nguồn validate ở server actions — cost nếu sai: validate trùng logic giữa client và server
