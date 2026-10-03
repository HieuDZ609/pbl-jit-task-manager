# Implementation Plan – Ứng dụng Quản lý Công việc Tích hợp E-learning cho Sinh viên JIT

**Epic Key:** BÁO CÁO KẾT QUẢ PHỎNG VẤN 24JIT@KS2  
**Epic Title:** Ứng dụng Quản lý Công việc Tích hợp E-learning cho Sinh viên JIT  
**Overview Doc:** /mnt/Nigga/Hoc Tap/PBL/docs/epics/BÁO_CÁO_KẾT_QUẢ_PHỎNG_VẤN_24JIT_KS2_EPIC_PLAN.md  
**Mode:** Build  
**Ngày tạo:** 2026-10-03  
**Trạng thái:** Ready for Execution

---

## 1. Mục tiêu Implementation Plan

Triển khai MVP ứng dụng di động với các quyết định đã duyệt:
- Tham chiếu: TickTick (85%)
- Ưu tiên: Ma trận Eisenhower 4 ô (A–D)
- Offline-first, tạm hoãn cloud sync
- Focus: Task, Eisenhower, Calendar/Timeline, Pomodoro + White Noise, Habit, Local Reminders, E-learning (Adapter + CSV/ICS)
- Tạm hoãn P2: AI Voice Assistant, Location-based Reminders

---

## 2. Tech Stack

| Lớp | Công nghệ | Lý do |
|---|---|---|
| Framework | React Native + Expo SDK (latest) | Nhanh, dev build dễ |
| Language | TypeScript (strict) | Type-safe |
| Routing | Expo Router (file-based) | Typed routes |
| Styling | NativeWind (TailwindCSS v3) | Design system nhất quán |
| DB | Drizzle ORM + expo-sqlite | Type-safe SQL, migrations |
| State | Zustand + TanStack Query | Nhẹ + async cache |
| Date | date-fns | Immutable |
| ID | nanoid | Unique |
| Notifications | expo-notifications | Local reminders |
| TTS | expo-speech (vi-VN) | Opt-in |
| Audio | expo-av | White noise |
| Icons | lucide-react-native | Gọn |
| Lists | @shopify/flash-list | Performance |
| Forms | react-hook-form + zod | Validation |
| Test Unit/Comp | vitest + @testing-library/react-native | Nhanh |
| E2E | maestro | Đơn giản |

---

## 3. Cấu trúc thư mục

```text
mobile/
├── app/                        # Expo Router
├── src/
│   ├── core/                   # db, store, providers, theme, config
│   ├── features/                # tasks, matrix, calendar, focus, habits, reminders, elearning, myday, stats
│   ├── services/               # notifications, tts, audio, elearning
│   └── shared/                 # ui, utils, types, schemas, hooks, constants
├── __tests__/
├── e2e/
├── assets/sounds/
└── drizzle/
```

---

## 4. Database Schema (Drizzle)

### Tables
- **folders** (id, name, color, sort_order, created_at, updated_at)
- **lists** (id, folder_id FK, name, color, sort_order, created_at, updated_at)
- **tasks** (id, list_id FK, title, content, eisenhower_quadrant A–D, due_at, start_at, remind_at, is_done, done_at, parent_id FK, my_day_at, recurring_rule_json, sort_order, created_at, updated_at, deleted_at)
- **checklists** (id, task_id FK, title, is_done, sort_order)
- **habits** (id, name, color, icon, frequency, target_count, start_date, archived, created_at, updated_at)
- **habit_logs** (id, habit_id FK, date, done, count) – unique(habit_id,date)
- **focus_sessions** (id, mode work/break/longBreak, started_at, ended_at, duration_min, completed, task_id FK)
- **elearning_items** (id, source manual/ics/csv/api, external_id, course, title, url, due_at, type, synced_at, read, created_at, updated_at)
- **reminders** (id, task_id FK, scheduled_at, type, voice_enabled, fired_at, cancelled, created_at)
- **preferences** (key PK, value_json)

---

## 5. Implementation Tickets

| ID | Title | Type | Priority | Points | Depends |
|---|---|---|---|---|---|
| IMP-001 | Scaffold Project (Expo + TS + NativeWind + Vitest) | Setup | P0 | 1 | — |
| IMP-002 | DB Layer & Migrations (Drizzle + expo-sqlite) | Setup | P0 | 2 | IMP-001 |
| IMP-003 | App Shell & Navigation (Expo Router + Tabs) | Infra | P0 | 1 | IMP-002 |
| IMP-004 | Tasks CRUD + Smart Lists + Subtasks/Checklist | Feature | P0 | 3 | IMP-003 |
| IMP-005 | Eisenhower Matrix (4 ô A–D) | Feature | P0 | 2 | IMP-004 |
| IMP-006 | Calendar/Timeline + Time-blocking | Feature | P0 | 2 | IMP-004 |
| IMP-007 | Pomodoro + White Noise | Feature | P0 | 2 | IMP-003 |
| IMP-008 | Habit Tracker + Streak | Feature | P0 | 2 | IMP-003 |
| IMP-009 | Local Reminders + TTS (Opt-in) | Feature | P0 | 2 | IMP-004 |
| IMP-010 | E-learning Adapter + CSV/ICS Import | Feature | P0 | 2 | IMP-004 |
| IMP-011 | My Day & Stats Dashboard | Feature | P0 | 1 | IMP-004,007,008 |
| IMP-012 | Testing Setup + Unit/Component Tests (>=90%) | QA | P0 | 2 | IMP-001–011 |
| IMP-013 | E2E (Maestro) + QA + Polish | QA/Polish | P0 | 1 | IMP-012 |

**Total:** ~21 Points

---

## 6. Sprint Breakdown

| Sprint | Tickets | Goal |
|---|---|---|
| Sprint 1 | IMP-001–003 | Scaffold + DB + Shell |
| Sprint 2 | IMP-004–005 | Tasks + Eisenhower |
| Sprint 3 | IMP-006–007 | Calendar + Pomodoro |
| Sprint 4 | IMP-008–009 | Habits + Reminders |
| Sprint 5 | IMP-010–011 | E-learning + My Day |
| Sprint 6 | IMP-012–013 | Tests + E2E + QA |

---

## 7. Definition of Done (MVP)

- [ ] Tất cả IMP-001–013 hoàn thành
- [ ] `npm run lint` – 0 errors
- [ ] `npm run typecheck` – 0 errors
- [ ] `npm run test:coverage` – >= 90% branch coverage
- [ ] 8 E2E flows Maestro pass
- [ ] Core flows hoạt động offline
- [ ] Eisenhower 4 ô A–D OK
- [ ] TTS opt-in, phát 1 lần tại reminder, tôn trọng DND/Silent
- [ ] CSV/ICS import + dedupe OK
- [ ] Subtasks/Checklist OK
- [ ] Pomodoro + White Noise OK
- [ ] Habit + Streak OK
- [ ] Calendar + Time-blocking OK
- [ ] My Day + Stats OK
- [ ] Dev build Android thành công

---

## 8. Next Action

**Bắt đầu IMP-001 – Scaffold Project**

Thực thi theo đúng thứ tự. Mỗi ticket phải pass verify trước khi sang tiếp theo.
