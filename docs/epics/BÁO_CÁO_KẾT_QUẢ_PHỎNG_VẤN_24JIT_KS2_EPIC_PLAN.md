# EPIC PLAN
**Ứng dụng Quản lý Công việc Tích hợp E-learning cho Sinh viên JIT**

**Epic Key:** BÁO CÁO KẾT QUẢ PHỎNG VẤN 24JIT@KS2  
**Epic Title:** Ứng dụng Quản lý Công việc Tích hợp E-learning cho Sinh viên JIT  
**Project:** PBL – Nhóm 7  
**Tham chiếu sản phẩm được chọn:** TickTick (85%)  
**Ngày tạo:** 2026-10-03  
**Trạng thái:** Approved – Ready for Build

---

## 1. Epic Overview

### 1.1 Mục tiêu của Epic

Xây dựng ứng dụng di động giúp sinh viên JIT giải quyết vấn đề **quá tải công việc và deadline**. Epic này tập trung trực tiếp vào nguyên nhân cốt lõi được xác định từ quá trình khảo sát: *“Không có sự nhắc nhở về độ cấp bách của công việc”*.

### 1.2 Vấn đề cần giải quyết (Problem Statement)

Từ kết quả phỏng vấn sinh viên 24JIT (Trần Quang Bình, Võ Hoàng Bách):

- **Pain Point chính:** Công việc và Deadline quá nhiều (≈80% thường xuyên)
- **Thời điểm căng thẳng:** Trước thi cuối kỳ, trước deadline
- **Cảm xúc:** Áp lực, stress, lo lắng, hồi hộp
- **Nguyên nhân cốt lõi:** Không có sự nhắc nhở về độ cấp bách của công việc
- **Quan điểm trái chiều:** 
  - Người 1: Chủ động hoàn thành, không cần nhắc nhở
  - Người 2: **Cần nhắc nhở** để hoàn thành đúng deadline

### 1.3 Giải pháp đề xuất

Thiết kế ứng dụng di động liên kết với E-learning của trường:
- Hỗ trợ lập lịch công việc theo mức độ ưu tiên (Ma trận Eisenhower)
- Tích hợp E-learning (thông báo bài tập, deadline)
- Phân chia công việc (ngắn hạn / dài hạn)
- Thông báo, nhắc nhở, kỷ luật bản thân (Voice reminder opt-in)
- Phát triển dựa trên TickTick làm tham chiếu, mở rộng tính năng phù hợp sinh viên Việt Nam

---

## 2. Scope

### In Scope (MVP)
- ✅ Task Management: CRUD, Lists/Folders (2 cấp), Subtasks, Checklist
- ✅ Eisenhower Matrix (4 ô A–D): Quan trọng/Khẩn cấp trực quan
- ✅ Smart Lists: Today, Tomorrow, Overdue, Upcoming, All, Completed
- ✅ Calendar/Timeline: Day/Week/Month + Time-blocking kéo-thả
- ✅ Pomodoro Focus: Timer 25/5, session log, White Noise
- ✅ Habit Tracker: Streak, heatmap, check-in
- ✅ Local Reminders: expo-notifications + TTS (opt-in, 1 lần, tôn trọng DND)
- ✅ E-learning Integration: Adapter Interface + CSV/ICS Import + dedupe
- ✅ My Day & Stats Dashboard

### Out of Scope (Deferred P2)
- ❌ AI Voice Assistant (phân loại, chia nhỏ plan, hỏi đáp)
- ❌ Location-based Reminders (GPS geofencing)
- ❌ Cloud Sync / Multi-device (Offline-first only)
- ❌ Team Collaboration / Kanban nhóm
- ❌ Full LMS API sync (chỉ CSV/ICS cho MVP)

---

## 3. Technical Decisions (Locked)

| Decision | Choice | Rationale |
|---|---|---|
| **Priority Model** | Eisenhower Matrix 4 ô (A–D) | Giải quyết trực tiếp "thiếu nhắc nhở độ cấp bách" |
| **Mobile Framework** | React Native + Expo SDK | Nhanh, dev build dễ, team quen TS |
| **Local DB** | Drizzle ORM + expo-sqlite | Type-safe SQL, migration rõ ràng |
| **State Management** | Zustand + TanStack Query | Nhẹ, tách client/server state |
| **Routing** | Expo Router (file-based) | Typed routes, deep linking |
| **Styling** | NativeWind (Tailwind v3) | Design system nhất quán |
| **Notifications** | expo-notifications (+ notifee nếu cần) | Chuẩn, hỗ trợ channel Android |
| **TTS** | expo-speech (vi-VN) | Đơn giản, opt-in |
| **Audio** | expo-av | White noise loop |
| **Testing** | Vitest + RTL (unit) + Maestro (E2E) | Coverage >=90% branch |

---

## 4. Database Schema (Drizzle)

### Core Tables
- **folders** – Thư mục cấp 1
- **lists** – Danh sách (FK -> folders, max 2 cấp)
- **tasks** – Công việc (eisenhower_quadrant A/B/C/D, due_at, remind_at, start_at, parent_id cho subtasks)
- **checklists** – Checklist items trong task
- **habits** – Thói quen (frequency, target_count)
- **habit_logs** – Nhật ký check-in (date unique per habit)
- **focus_sessions** – Pomodoro sessions (mode, duration, task_id)
- **elearning_items** – Cache E-learning (external_id + source dedupe)
- **reminders** – Lịch nhắc nhở (scheduled_at, voice_enabled, fired_at)
- **preferences** – Key-value settings

---

## 5. Implementation Tickets (13 tickets)

| ID | Title | Priority | Points | Depends |
|---|---|---|---|---|
| IMP-001 | Scaffold Project (Expo + TS + NativeWind + Vitest) | P0 | 1 | — |
| IMP-002 | DB Layer & Migrations (Drizzle + expo-sqlite) | P0 | 2 | IMP-001 |
| IMP-003 | App Shell & Navigation (Expo Router + Tabs) | P0 | 1 | IMP-002 |
| IMP-004 | Tasks CRUD + Smart Lists + Subtasks/Checklist | P0 | 3 | IMP-003 |
| IMP-005 | Eisenhower Matrix (A–D) 2x2 Grid | P0 | 2 | IMP-004 |
| IMP-006 | Calendar/Timeline + Time-blocking | P0 | 2 | IMP-004 |
| IMP-007 | Pomodoro + White Noise | P0 | 2 | IMP-003 |
| IMP-008 | Habit Tracker + Streak | P0 | 2 | IMP-003 |
| IMP-009 | Local Reminders + TTS (Opt-in) | P0 | 2 | IMP-004 |
| IMP-010 | E-learning Adapter + CSV/ICS Import | P0 | 2 | IMP-004 |
| IMP-011 | My Day & Stats Dashboard | P0 | 1 | IMP-004,007,008 |
| IMP-012 | Testing Setup + Unit/Component Tests (>=90%) | P0 | 2 | IMP-001–011 |
| IMP-013 | E2E (Maestro) + QA + Polish | P0 | 1 | IMP-012 |

**Total:** ~21 Story Points

---

## 6. Sprint Breakdown

| Sprint | Tickets | Goal |
|---|---|---|
| Sprint 1 | IMP-001 – IMP-003 | Scaffold + DB + Shell |
| Sprint 2 | IMP-004 – IMP-005 | Tasks + Eisenhower |
| Sprint 3 | IMP-006 – IMP-007 | Calendar + Pomodoro |
| Sprint 4 | IMP-008 – IMP-009 | Habits + Reminders |
| Sprint 5 | IMP-010 – IMP-011 | E-learning + My Day |
| Sprint 6 | IMP-012 – IMP-013 | Tests + QA |

---

## 7. Definition of Done (Epic MVP)

- [ ] Tất cả 13 tickets hoàn thành
- [ ] `npm run lint` – 0 errors
- [ ] `npm run typecheck` – 0 errors  
- [ ] `npm run test:coverage` – **>= 90% branch coverage**
- [ ] 8 E2E flows (Maestro) pass
- [ ] Core flows hoạt động offline
- [ ] Eisenhower Matrix hiển thị đúng 4 ô A–D
- [ ] TTS opt-in, phát 1 lần tại reminder, tôn trọng DND
- [ ] CSV/ICS import + dedupe OK
- [ ] Subtasks, Checklist hoạt động
- [ ] Pomodoro + White Noise OK
- [ ] Habit + Streak OK
- [ ] Calendar + Time-blocking OK
- [ ] Dev build Android thành công

---

## 8. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---|---|
| E-learning format đa dạng | Medium | Chấp nhận subset CSV/ICS đơn giản, validate rõ ràng |
| TTS tiếng Việt | Medium | expo-speech mặc định, fallback text notification |
| Notifications Android Doze | Medium | Test thiết bị thật, giữ logic resilient |
| Timer foreground minimize | Medium | Foreground service nếu cần (dev build) |
| Scope creep AI/Location | Low | Giữ P2, không thêm vào MVP |

---

## 9. Next Action

Bắt đầu **IMP-001 – Scaffold Project** ngay lập tức.
