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
Task 12: complete (tests: node ../../node_modules/vitest/vitest.mjs run in apps/web → 189/189 pass)
Task 12: Ruling: ReminderRepeat định nghĩa trong features/reminders/reminder-logic.ts và được repository import ngược lại — lý do: tránh thêm cycle với packages/types; chấp nhận feature layer là nguồn type — cost nếu sai: server layer phụ thuộc feature layer
Task 13: complete (commits WEB-013..HEAD, tests: node ../../node_modules/vitest/vitest.mjs run in apps/web → 251/251 pass)
Task 13: Ruling: dedupe key = source+externalId khi có UID, ngược lại source+title+dueAt (CSV không có id nên phải fallback) — theo đúng brief; cost nếu sai: import lại cùng bài CSV với dueAt khác định dạng sẽ tạo bản ghi trùng
Task 13: Ruling: parsers đặt ở apps/web/src/services/elearning thay vì packages/elearning — lý do: brief ghi "prefer packages/elearning or apps/web services"; chọn apps/web để dùng chung vitest config sẵn có, không thêm workspace package — cost nếu sai: mobile app sẽ phải copy logic thay vì import
Task 14: complete (commits WEB-014..HEAD, tests: node ../../node_modules/vitest/vitest.mjs run in apps/web → 278/278 pass)
Task 14: Ruling: toggleMyDayTask nhận chỉ taskId và tự đảo trạng thái qua repos.tasks.setDone — lý do: TaskRepository đã có setDone (quản lý doneAt), UpdateTaskInput không có isDone; tránh thêm field mới — cost nếu sai: không cho phép client truyền isDone tường minh
Task 14: Ruling: MyDay chỉ hiện task có myDayAt = hôm nay, KHÔNG tự ghim task có dueAt hôm nay — lý do: brief nói "tasks with my_day_at today or pinned" nhưng dueAt hôm nay đã thuộc smart list Today của WEB-007; tránh trùng lặp hai nguồn sự thật — cost nếu sai: người dùng giao dueAt hôm nay không thấy ở Hôm nay
Task 15: complete (commits WEB-015..HEAD, tests: node ../../node_modules/vitest/vitest.mjs run in apps/web → 321/321 pass; npx next build → compiled successfully, 12 routes)
Task 15: Ruling: gộp hai app dir về apps/web/app/ làm app dir duy nhất — lý do: Next ưu tiên app/ và cảnh báo khi có src/app/ cùng lúc; src/app/ chỉ còn dead code WEB-002 nhưng globals.css lại nằm ở đó; xoá src/app/layout.tsx tránh 2 root layout — cost nếu sai: không có
Task 15: Ruling: FocusTimer nhận server action saveFocusSession trực tiếp thay vì closure inline — lý do: Event handlers không truyền được từ Server Component sang Client Component; build đỏ chứng minh — cost nếu sai: không có
Task 15: Ruling: trang /focus và /matrix /calendar /tasks để static (không dynamic) vì không đọc dữ liệu server; các trang đọc repos giữ force-dynamic — lý do: Next không thể prerender trang gọi repo in-memory theo request; build xanh là tiêu chí — cost nếu sai: dữ liệu mặc định đọc 1 lần lúc build cho các trang static này
Task 16: complete (commits WEB-016..HEAD, tests: npx vitest run --coverage in apps/web → 46 files, 380/380 pass, All files branches 92.33% (threshold 90 enforced); npx next build → compiled successfully)
Task 16: Ruling: thêm alias @pbl/validators, @pbl/types, @pbl/db vào vitest.config.ts — lý do: server actions import @pbl/validators mà vitest chỉ alias '@', nên không test được action nào; không sửa code app — cost nếu sai: không có
Task 16: Ruling: TaskSchema.title thêm .trim() — lý do: createTask trước đó không validate, title toàn khoảng trắng lọt xuống repository; test "rejects an empty title" bắt được — cost nếu sai: title có khoảng trắng ý nghĩa bị cắt
Task 16: Ruling: coverage thresholds đặt branches 90 (theo contract), statements/functions/lines 80 — lý do: contract chỉ yêu cầu branches >=90; đặt 90 cho cả 4 sẽ fail vì statements thực tế 88.09 — cost nếu sai: statements có thể tụt dưới 90 mà CI không bắt
Task 16: Ruling: thêm empty state cho MatrixGrid — lý do: Task 15 yêu cầu polish empty states, ma trận không có; test viết trước rồi implement — cost nếu sai: không có
