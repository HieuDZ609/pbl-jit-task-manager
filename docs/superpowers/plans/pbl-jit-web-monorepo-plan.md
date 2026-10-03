# Plan: PBL JIT Task Manager – Web-first Monorepo (Next.js 15 + Auth.js + Drizzle + PostgreSQL)

**Plan File:** /mnt/Nigga/Hoc_Tap/PBL/docs/superpowers/plans/pbl-jit-web-monorepo-plan.md
**Spec:** /mnt/Nigga/Hoc_Tap/PBL/docs/epics/BÁO_CÁO_KẾT_QUẢ_PHỎNG_VẤN_24JIT_KS2_EPIC_PLAN.md
**Impl Plan:** /mnt/Nigga/Hoc_Tap/PBL/docs/epics/impl/BÁO_CÁO_KẾT_QUẢ_PHỎNG_VẤN_24JIT_KS2_IMPL_PLAN.md
**Workspace:** .superpowers/sdd/pbl-jit-web-monorepo-plan/
**Mode:** Inline execution (executing-plans)
**Target:** Web MVP WEB-001..WEB-017 → Android sau

## Global Constraints
- TypeScript strict
- Monorepo: Turborepo + pnpm workspaces
- Web: Next.js 15 App Router + Tailwind v3 + shadcn/ui
- Auth: Auth.js v5 + Google OAuth
- DB: Drizzle ORM + PostgreSQL (shared packages/db)
- Shared: packages/db, packages/types, packages/validators
- Tests: Vitest + @testing-library/react (web), coverage >= 90% branch
- E2E: Playwright (web)
- No cloud sync logic premature; keep offline-friendly UX
- Eisenhower A–D, Pomodoro+White Noise, Habit+Streak, Calendar/Timeline+Time-blocking, Reminders, E-learning CSV/ICS, My Day+Stats, Subtasks/Checklist

## Pre-flight (shared interfaces)
- packages/db/schemas: folders, lists, tasks, checklists, habits, habit_logs, focus_sessions, elearning_items, reminders, preferences
- packages/validators: Zod mirrors schemas
- packages/types: inferred types
- apps/web uses db/validators/types only (no duplication)

## Review Focus
- Auth.js v5 config correct (Google provider)
- Drizzle schema FK + indexes minimal
- RLS notes (if Supabase) but local dev fine
- TDD evidence present (RED→GREEN)
- No secrets in repo
- Coverage >=90% branch on changed+core
- Playwright core flows

---

## TASK 1: WEB-001 – Monorepo Scaffold (Turborepo + pnpm + TypeScript strict)

### Brief
Create root monorepo with:
- package.json (workspaces + scripts)
- pnpm-workspace.yaml
- turbo.json
- tsconfig.base.json
- .gitignore updates (node_modules, .next, dist, .turbo)
- .editorconfig minimal
- README.md stub

**Consumes:** none  
**Produces:** monorepo root

### Steps (RED→GREEN)
1. **RED:** Create sanity test `tests/root/monorepo.test.ts` asserting required files exist. Run: `pnpm --filter root-tests exec vitest run --reporter=basic tests/root/monorepo.test.ts` (or create root-tests package). Expect FAIL (files missing).
2. **GREEN:** Scaffold files. Run same test → PASS.
3. **Verify:** `pnpm install --ignore-scripts` (optional) but prefer structure; `pnpm run lint` if exists? Create minimal. Also `pnpm --version && node --version`.
4. **Commit:** per plan step commit style.

### Expected
Step 1: non-zero exit, FAIL with missing files  
Step 2: 1/1 pass

### Commit
`chore(web): WEB-001 monorepo scaffold (turbo+pnpm+ts)`

### Completion Contract
- Files exist: package.json, pnpm-workspace.yaml, turbo.json, tsconfig.base.json, .gitignore
- Test passes
- Ledger line: `Task 1: complete (commits <base7>..<head7>, tests: pnpm exec vitest run tests/root/monorepo.test.ts → 1/1 pass)`

---

## TASK 2: WEB-002 – apps/web Scaffold (Next.js 15 App Router + Tailwind v3 + shadcn/ui + Vitest)

### Brief
Scaffold `apps/web`:
- Next.js 15 (App Router), TS strict
- Tailwind CSS v3 + postcss + autoprefixer
- shadcn/ui init (components.json, globals.css, utils)
- vitest + @testing-library/react + jsdom
- basic app/layout.tsx, page.tsx, not-found

**Consumes:** WEB-001  
**Produces:** apps/web working

### Steps (RED→GREEN)
1. **RED:** `__tests__/web/smoke.test.ts` assert home renders. Run: `pnpm --filter web exec vitest run __tests__/web/smoke.test.ts` → FAIL
2. **GREEN:** Scaffold. Run → PASS
3. **Verify:** `pnpm --filter web build --no-lint 2>&1 | tail -20` (build check non-blocking warning ok)
4. **Commit:** `feat(web): WEB-002 apps/web scaffold (next15+tailwindv3+shadcn+vitest)`

### Expected
Step 1: FAIL (missing app)  
Step 2: PASS

### Completion Contract
- apps/web/package.json exists, next.config.mjs/tsconfig, tailwind.config.ts, components.json
- Smoke test passes
- Build check attempted

---

## TASK 3: WEB-003 – Auth: Google OAuth (Auth.js v5) + Session + Protected Routes

### Brief
Add Auth.js v5:
- `apps/web/auth.ts`, `apps/web/auth.config.ts` (edge-safe), `apps/web/middleware.ts`
- `apps/web/app/api/auth/[...nextauth]/route.ts`
- `.env.example` with AUTH_SECRET, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET, AUTH_URL
- Protected `/dashboard` (redirect if no session)
- Test: unauthenticated redirect to signin

**Consumes:** WEB-002  
**Produces:** auth skeleton

### Steps (RED→GREEN)
1. **RED:** `__tests__/web/auth/protect.test.tsx` → visit /dashboard unauth -> redirect. Run filter web vitest → FAIL
2. **GREEN:** Implement minimal. Run → PASS
3. **Verify:** no hardcoded secrets
4. **Commit:** `feat(web): WEB-003 auth.js v5 google oauth + protected routes`

### Expected
Step 1: FAIL  
Step 2: PASS

### Completion Contract
- auth.ts + middleware present
- .env.example updated
- Test passes

---

## TASK 4: WEB-004 – packages/db (Drizzle + PostgreSQL + Schemas + Migrations)

### Brief
Create `packages/db`:
- package.json, tsconfig.json
- `src/index.ts`, `src/client.ts`, `src/schema.ts` (all tables)
- `drizzle.config.ts`
- `scripts/migrate.ts` stub
- .env.example vars DATABASE_URL
- Unit test: schema exports non-empty

**Consumes:** WEB-001  
**Produces:** shared DB layer

### Steps (RED→GREEN)
1. **RED:** `packages/db/__tests__/schema.test.ts` assert exports exist (folders, lists, tasks). Run `pnpm --filter @pbl/db exec vitest run` → FAIL
2. **GREEN:** Implement schema per Epic (folders,lists,tasks,checklists,habits,habit_logs,focus_sessions,elearning_items,reminders,preferences, FKs, indexes, soft delete tasks.deleted_at). Run → PASS
3. **Verify:** types compile `pnpm --filter @pbl/db run typecheck` (if script) or ts
4. **Commit:** `feat(db): WEB-004 drizzle pg schema + client + config`

### Expected
Step 1: FAIL  
Step 2: PASS

### Completion Contract
- schema exports all tables
- drizzle.config.ts present
- Tests pass, typecheck ok

---

## TASK 5: WEB-005 – packages/types + packages/validators (Zod shared)

### Brief
Create `packages/types` and `packages/validators`:
- Zod schemas mirror DB (TaskInsert/TaskSelect, Eisenhower A–D enum)
- Export inferred types to @pbl/types
- Tests assert roundtrip

**Consumes:** WEB-004  
**Produces:** shared types/validators

### Steps (RED→GREEN)
1. **RED:** `packages/validators/__tests__/task.schema.test.ts` zod parse valid/invalid. `pnpm --filter @pbl/validators exec vitest run` → FAIL
2. **GREEN:** Implement. Run both filters validators+types compile
3. **Verify:** cross-import works
4. **Commit:** `feat(shared): WEB-005 zod validators + inferred types`

### Expected
Step 1: FAIL  
Step 2: PASS

### Completion Contract
- Validators export TaskSchema, Eisenhower enum A–D
- Types re-export inferred
- Tests pass

---

## TASK 6: WEB-006 – Web App Shell (Sidebar + Header + Theme) + App Router Structure

### Brief
Layout: `apps/web/app/(app)/layout.tsx` with sidebar, header, user button (Auth.js), theme (next-themes). Routes: /dashboard, /tasks, /matrix, /calendar, /focus, /habits, /reminders, /elearning, /myday, /settings. Auth protected via middleware (extend). Unit test shell renders.

**Consumes:** WEB-003,WEB-005  
**Produces:** app shell

### Steps (RED→GREEN)
1. **RED:** `__tests__/web/layout/shell.test.tsx` renders sidebar links. Run web vitest → FAIL
2. **GREEN:** Implement shell + routes. Run → PASS
3. **Verify:** protected groups work
4. **Commit:** `feat(web): WEB-006 app shell (sidebar+header+theme)`

### Expected
Step 1: FAIL  
Step 2: PASS

### Completion Contract
- (app)/layout present, links exist
- Test passes

---

## TASK 7: WEB-007 – Tasks CRUD + Folders/Lists + Subtasks + Checklist

### Brief
Features:
- Folders/Lists (2-level)
- Tasks CRUD, soft delete, done/reopen, my_day_at
- Subtasks (parent_id)
- Checklists
- Smart Lists: Today/Tomorrow/Overdue/Upcoming/All/Completed
- Zustand store + TanStack Query hooks (or server actions)

**Consumes:** WEB-006  
**Produces:** tasks core

### Steps (RED→GREEN)
1. **RED:** `__tests__/web/tasks/tasks.crud.test.tsx` create task → appears. Run → FAIL
2. **GREEN:** Implement. Run → PASS
3. **Verify:** subtasks/checklist toggle works
4. **Commit:** `feat(web): WEB-007 tasks crud + folders/lists + subtasks + checklist`

### Expected
Step 1: FAIL  
Step 2: PASS

### Completion Contract
- CRUD works, smart lists compute correctly
- Tests pass, >=90% branch on tasks logic

---

## TASK 8: WEB-008 – Eisenhower Matrix (4 ô A–D) – Grid + Drag/Drop

### Brief
2x2: A (Important+Urgent), B (Important+Not), C (Not+Important), D (Not+Not). Drag task between quadrants updates eisenhower_quadrant. Visual badges. Persist.

**Consumes:** WEB-007  
**Produces:** matrix

### Steps (RED→GREEN)
1. **RED:** `__tests__/web/matrix/matrix.dnd.test.tsx` drag A→B updates quadrant. Run → FAIL
2. **GREEN:** Implement (@dnd-kit or native). Run → PASS
3. **Verify:** empty states
4. **Commit:** `feat(web): WEB-008 eisenhower matrix 4-quadrant + dnd`

### Expected
Step 1: FAIL  
Step 2: PASS

### Completion Contract
- Quadrant enum enforced A–D
- DnD persists
- Tests pass

---

## TASK 9: WEB-009 – Calendar/Timeline + Time-blocking (Day/Week/Month)

### Brief
Views: Day/Week/Month + Timeline. Drag task to slot sets start_at/due_at or time range. Click slot to create. Filter by list.

**Consumes:** WEB-007  
**Produces:** calendar

### Steps (RED→GREEN)
1. **RED:** `__tests__/web/calendar/timeblock.test.tsx` time-block sets start/end. Run → FAIL
2. **GREEN:** Implement (date-fns + grid). Run → PASS
3. **Verify:** overlaps handled gracefully
4. **Commit:** `feat(web): WEB-009 calendar+timeline+time-blocking`

### Expected
Step 1: FAIL  
Step 2: PASS

### Completion Contract
- Views switch, time-block persists
- Tests pass

---

## TASK 10: WEB-010 – Pomodoro + White Noise (Web Audio)

### Brief
Modes: work/break/longBreak (25/5/15). Timer, progress, auto-switch, complete session logs focus_sessions (task_id). White Noise: rain/cafe/forest/ocean, loop, mute, volume. Web Audio (HTMLAudioElement or AudioContext safe).

**Consumes:** WEB-006  
**Produces:** focus

### Steps (RED→GREEN)
1. **RED:** `__tests__/web/focus/pomodoro.test.tsx` start session creates log on complete (mock timer). Run → FAIL
2. **GREEN:** Implement with fake timers (vi.useFakeTimers). Run → PASS
3. **Verify:** pause/resume, long break
4. **Commit:** `feat(web): WEB-010 pomodoro + white noise`

### Expected
Step 1: FAIL  
Step 2: PASS

### Completion Contract
- Session completes → focus_sessions row logic tested
- White noise toggle non-blocking
- Tests pass

---

## TASK 11: WEB-011 – Habit Tracker + Streak + Heatmap

### Brief
Habits: frequency (daily/weekly), target_count, color/icon, archive. Logs habit_logs (unique date). Streak (current+longest), heatmap (calendar grid). Check-in + count.

**Consumes:** WEB-006  
**Produces:** habits

### Steps (RED→GREEN)
1. **RED:** `__tests__/web/habits/streak.test.ts` streak calculation (consecutive). Run → FAIL
2. **GREEN:** Implement pure utils + UI. Run → PASS
3. **Verify:** timezone safe (local date)
4. **Commit:** `feat(web): WEB-011 habit tracker + streak + heatmap`

### Expected
Step 1: FAIL (util missing)  
Step 2: PASS

### Completion Contract
- Streak logic unit tested
- Heatmap renders
- Tests pass

---

## TASK 12: WEB-012 – Local/Web Notifications + Reminders (Browser Notifications)

### Brief
Reminders: task.remind_at → schedule browser notification (Notification API). Opt-in, respects DND not forced (graceful). TTS deferred (mobile later). Fire once, mark fired_at. Test permission/state.

**Consumes:** WEB-007  
**Produces:** reminders

### Steps (RED→GREEN)
1. **RED:** `__tests__/web/reminders/schedule.test.ts` schedule logic maps remind_at. Run → FAIL
2. **GREEN:** Implement service (permission check). Run → PASS
3. **Verify:** past reminders ignored, dedupe
4. **Commit:** `feat(web): WEB-012 web reminders + browser notifications (opt-in)`

### Expected
Step 1: FAIL  
Step 2: PASS

### Completion Contract
- Scheduling pure (testable), browser API mocked in tests
- Opt-in guard
- Tests pass

---

## TASK 13: WEB-013 – E-learning Adapter + CSV/ICS Import + Dedupe

### Brief
Adapter interface: `ElearningAdapter` (parse -> normalize). CSV: course,title,due_at,url,type. ICS: VEVENT SUMMARY/DTSTART/URL/CATEGORIES. Dedupe by (source+external_id) or (source+title+due_at). Import UI + preview + confirm. Store in elearning_items.

**Consumes:** WEB-007  
**Produces:** elearning

### Steps (RED→GREEN)
1. **RED:** `__tests__/elearning/ics.parse.test.ts` + `csv.parse.test.ts` + `dedupe.test.ts`. Run packages filters or web? put parsers in `packages/shared-utils` or `apps/web/src/services/elearning`. Prefer `packages/elearning` or `apps/web` services testable. Run vitest → FAIL
2. **GREEN:** Implement pure parsers + adapter. Run → PASS
3. **Verify:** invalid dates ignored safely
4. **Commit:** `feat(web): WEB-013 elearning adapter + csv/ics import + dedupe`

### Expected
Step 1: FAIL  
Step 2: PASS

### Completion Contract
- Parsers pure, dedupe correct
- UI import works
- Tests pass

---

## TASK 14: WEB-014 – My Day + Stats Dashboard

### Brief
My Day: tasks with my_day_at today or pinned. Quick add. Stats: completed today/this week, overdue, focus minutes (focus_sessions), habit completion rate, streaks, Eisenhower counts A–D.

**Consumes:** WEB-007,WEB-010,WEB-011  
**Produces:** dashboard

### Steps (RED→GREEN)
1. **RED:** `__tests__/web/myday/stats.test.tsx` stats compute from fixtures. Run → FAIL
2. **GREEN:** Implement selectors/utils + UI. Run → PASS
3. **Verify:** empty states
4. **Commit:** `feat(web): WEB-014 my day + stats dashboard`

### Expected
Step 1: FAIL  
Step 2: PASS

### Completion Contract
- Stats correct with seeded data
- My Day toggle works
- Tests pass

---

## TASK 15: WEB-015 – PWA + Responsive (Mobile Web) + Polish

### Brief
next-pwa or built-in: manifest.json, icons placeholders, service worker minimal. Responsive: sidebar collapse mobile, touch targets. Polish empty states.

**Consumes:** WEB-014  
**Produces:** pwa+responsive

### Steps (RED→GREEN)
1. **RED:** `__tests__/web/pwa/manifest.test.ts` manifest exists + name. Run → FAIL
2. **GREEN:** Add manifest + meta. Run → PASS
3. **Verify:** Lighthouse basic (optional) but structure ok
4. **Commit:** `feat(web): WEB-015 pwa + responsive polish`

### Expected
Step 1: FAIL  
Step 2: PASS

### Completion Contract
- public/manifest.json present
- Responsive classes used
- Tests pass

---

## TASK 16: WEB-016 – Unit/Component Tests (Vitest + RTL) >= 90% branch coverage

### Brief
Raise coverage on core: tasks, matrix, calendar, habits utils, elearning parsers, reminders logic. Add integration-like component tests. Enforce coverage config (branches >=90% for critical). Run `pnpm --filter web exec vitest run --coverage`.

**Consumes:** WEB-007–WEB-014  
**Produces:** coverage >=90%

### Steps (RED→GREEN)
1. **RED:** Add missing tests to hit branches. Run coverage → <90% (expect)
2. **GREEN:** Fix gaps (no logic change except tests). Run coverage → >=90%
3. **Verify:** vitest.config coverage thresholds
4. **Commit:** `test(web): WEB-016 increase coverage >=90% branches`

### Expected
Step 1: <90% or fails threshold  
Step 2: >=90%

### Completion Contract
- web coverage branches >= 90%
- No flaky tests
- Ledger: tests show coverage summary

---

## TASK 17: WEB-017 – E2E Tests (Playwright) – Core Flows (8 scenarios) + QA

### Brief
8 core flows:
1. Auth Google login (mock or skip in CI-safe)
2. Create Folder/List + Task + Subtask + Checklist
3. Eisenhower move A→B persists
4. Time-block task in Week view
5. Pomodoro complete logs session + White Noise toggle
6. Habit check-in + streak + heatmap
7. CSV/ICS import + dedupe
8. My Day add/remove + Stats update

Playwright config, `e2e/` in apps/web or root `e2e/` shared? put `apps/web/e2e/`. Mock auth safe or storageState.

**Consumes:** WEB-016  
**Produces:** E2E green

### Steps (RED→GREEN)
1. **RED:** Write specs. Run `pnpm --filter web exec playwright test --list` ok, run critical → FAIL
2. **GREEN:** Stabilize. Run `pnpm --filter web exec playwright test` → all pass
3. **Verify:** no hardcoded waits, retries reasonable
4. **Commit:** `test(e2e): WEB-017 playwright core flows (8 scenarios)`

### Expected
Step 1: >=1 FAIL  
Step 2: 8/8 pass (core)

### Completion Contract
- E2E core flows pass
- Playwright config present
- QA notes minimal

---

## Final Whole-Branch Review
Use code-reviewer (fresh context) against package from MERGE_BASE..HEAD. Fix Critical/Important in ONE pass (RED→GREEN each), ledger minors deferred. Delete workspace after clean.
