import { pgTable, uuid, text, timestamp, integer, boolean, json, varchar } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const folders = pgTable('folders', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  color: text('color'),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const lists = pgTable('lists', {
  id: uuid('id').primaryKey().defaultRandom(),
  folderId: uuid('folder_id').references(() => folders.id),
  name: text('name').notNull(),
  color: text('color'),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const eisenhowerEnum = ['A', 'B', 'C', 'D'] as const

export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
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
})

export const checklists = pgTable('checklists', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id').references(() => tasks.id),
  title: text('title').notNull(),
  isDone: boolean('is_done').default(false),
  sortOrder: integer('sort_order').default(0),
})

export const habits = pgTable('habits', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  color: text('color'),
  icon: text('icon'),
  frequency: text('frequency').default('daily'),
  targetCount: integer('target_count').default(1),
  startDate: timestamp('start_date').defaultNow(),
  archived: boolean('archived').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const habitLogs = pgTable('habit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  habitId: uuid('habit_id').references(() => habits.id),
  date: timestamp('date').notNull(),
  done: boolean('done').default(true),
  count: integer('count').default(1),
})

export const focusSessions = pgTable('focus_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  mode: varchar('mode', { length: 20 }).default('work'),
  startedAt: timestamp('started_at').defaultNow(),
  endedAt: timestamp('ended_at'),
  durationMin: integer('duration_min'),
  completed: boolean('completed').default(false),
  taskId: uuid('task_id').references(() => tasks.id),
})

export const elearningItems = pgTable('elearning_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  source: varchar('source', { length: 20 }).default('manual'),
  externalId: text('external_id'),
  course: text('course'),
  title: text('title').notNull(),
  url: text('url'),
  dueAt: timestamp('due_at'),
  type: text('type'),
  syncedAt: timestamp('synced_at'),
  read: boolean('read').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const reminders = pgTable('reminders', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id').references(() => tasks.id),
  scheduledAt: timestamp('scheduled_at').notNull(),
  type: varchar('type', { length: 20 }).default('notification'),
  voiceEnabled: boolean('voice_enabled').default(false),
  firedAt: timestamp('fired_at'),
  cancelled: boolean('cancelled').default(false),
  createdAt: timestamp('created_at').defaultNow(),
})

export const preferences = pgTable('preferences', {
  key: varchar('key', { length: 100 }).primaryKey(),
  valueJson: json('value_json'),
})
