import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  json,
  varchar,
  uniqueIndex,
  index,
  primaryKey,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // Google xác thực danh tính bằng email, nên email là bắt buộc và unique.
    // Không còn đăng nhập bằng sĐT/mật khẩu (Task 13) → bỏ `phone`,
    // `password_hash` và `users_phone_unique`.
    email: text('email').notNull(),
    name: text('name'),
    avatarUrl: text('avatar_url'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (t) => [uniqueIndex('users_email_unique').on(t.email)],
)

export const folders = pgTable(
  'folders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    name: text('name').notNull(),
    color: text('color'),
    sortOrder: integer('sort_order').default(0),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (t) => [index('folders_user_id_idx').on(t.userId)],
)

export const lists = pgTable(
  'lists',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    folderId: uuid('folder_id').references(() => folders.id),
    name: text('name').notNull(),
    color: text('color'),
    sortOrder: integer('sort_order').default(0),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (t) => [index('lists_user_id_idx').on(t.userId)],
)

export const eisenhowerEnum = ['A', 'B', 'C', 'D'] as const

export const tasks = pgTable(
  'tasks',
  {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  listId: uuid('list_id').references(() => lists.id),
  title: text('title').notNull(),
  content: text('content'),
  eisenhowerQuadrant: varchar('eisenhower_quadrant', { length: 1 }).$type<'A' | 'B' | 'C' | 'D'>(),
  dueAt: timestamp('due_at'),
  startAt: timestamp('start_at'),
  remindAt: timestamp('remind_at'),
  isDone: boolean('is_done').default(false),
  doneAt: timestamp('done_at'),
  parentId: uuid('parent_id'),
  myDayAt: timestamp('my_day_at'),
  recurringRuleJson: json('recurring_rule_json'),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
  },
  (t) => [index('tasks_user_id_idx').on(t.userId)],
)

export const checklists = pgTable(
  'checklists',
  {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  taskId: uuid('task_id').references(() => tasks.id),
  title: text('title').notNull(),
  isDone: boolean('is_done').default(false),
  sortOrder: integer('sort_order').default(0),
  },
  (t) => [index('checklists_user_id_idx').on(t.userId)],
)

export const habits = pgTable(
  'habits',
  {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  name: text('name').notNull(),
  color: text('color'),
  icon: text('icon'),
  frequency: text('frequency').default('daily'),
  targetCount: integer('target_count').default(1),
  startDate: timestamp('start_date').defaultNow(),
  archived: boolean('archived').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  },
  (t) => [index('habits_user_id_idx').on(t.userId)],
)

export const habitLogs = pgTable(
  'habit_logs',
  {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  habitId: uuid('habit_id').references(() => habits.id),
  date: timestamp('date').notNull(),
  done: boolean('done').default(true),
  count: integer('count').default(1),
  },
  (t) => [
    index('habit_logs_user_id_idx').on(t.userId),
    // Một habit chỉ có một log mỗi ngày: check-in lần hai trong ngày là cộng thêm
    // vào `count` chứ không tạo dòng mới. Ràng buộc đặt ở DB thay vì chỉ kiểm
    // trong code, nếu không thì hai request song song có thể tạo hai dòng cùng
    // ngày và streak tính sai. Ngày luôn quy về UTC midnight (xem `HabitRepository`).
    uniqueIndex('habit_logs_habit_id_date_uidx').on(t.habitId, t.date),
  ],
)

export const focusSessions = pgTable(
  'focus_sessions',
  {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  mode: varchar('mode', { length: 20 }).default('work'),
  startedAt: timestamp('started_at').defaultNow(),
  endedAt: timestamp('ended_at'),
  durationMin: integer('duration_min'),
  completed: boolean('completed').default(false),
  taskId: uuid('task_id').references(() => tasks.id),
  },
  (t) => [index('focus_sessions_user_id_idx').on(t.userId)],
)

export const elearningItems = pgTable(
  'elearning_items',
  {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  source: varchar('source', { length: 20 }).default('manual'),
  externalId: text('external_id'),
  course: text('course'),
  title: text('title').notNull(),
  url: text('url'),
  // Cột text chứ không phải timestamp: deadline e-learning về bản chất là *ngày*
  // (`ElearningItemInput.dueAt` là `string`), không có giờ. Lưu timestamp sẽ buộc
  // phải chọn múi giờ lúc ghi và lúc đọc, và chỉ cần lệch một ngày là sai deadline.
  // Giữ nguyên chuỗi `YYYY-MM-DD` qua cả hai chiều.
  dueAt: text('due_at'),
  type: text('type'),
  syncedAt: timestamp('synced_at'),
  read: boolean('read').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  },
  (t) => [index('elearning_items_user_id_idx').on(t.userId)],
)

export const reminders = pgTable(
  'reminders',
  {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  taskId: uuid('task_id').references(() => tasks.id),
  // Domain `Reminder` là một thực thể độc lập có `title` của riêng nó (không bắt
  // buộc phải gắn task), nên bảng phải có hai cột này. `repeat` lưu nguyên tắc
  // lặp; lần lặp tiếp theo luôn giữ **giờ gốc** (xem `ReminderRepository`).
  title: text('title').notNull().default(''),
  repeat: varchar('repeat', { length: 10 }).notNull().default('none'),
  scheduledAt: timestamp('scheduled_at').notNull(),
  type: varchar('type', { length: 20 }).default('notification'),
  voiceEnabled: boolean('voice_enabled').default(false),
  firedAt: timestamp('fired_at'),
  // `cancelled` là chiều **ngược** của domain `done`: xoá đánh dấu chưa xong =
  // `cancelled = false`. Adapter map hai chiều, đừng đọc thẳng `cancelled` như
  // `done` — dễ đảo nhầm và sinh reminder "đã xong" giả.
  cancelled: boolean('cancelled').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  },
  (t) => [index('reminders_user_id_idx').on(t.userId)],
)

export const preferences = pgTable(
  'preferences',
  {
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  key: varchar('key', { length: 100 }).notNull(),
  valueJson: json('value_json'),
  },
  // `key` là global ⇒ nhiều user sẽ đụng nhau. Composite PK là cách duy nhất
  // để mỗi user có một bản riêng cho cùng một khoá.
  (t) => [primaryKey({ columns: [t.key, t.userId] })],
)
