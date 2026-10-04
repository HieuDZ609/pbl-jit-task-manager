import { describe, it, expect } from 'vitest'
import { getTableConfig } from 'drizzle-orm/pg-core'

import * as schema from '../src/schema'

/**
 * Mọi bảng nghiệp vụ phải thuộc về một user. Đây là nền tảng chống IDOR ở
 * tầng schema: không có `userId NOT NULL` thì mọi query sau này đều có thể
 * vô tình đọc/cross-user nếu quên điều kiện lọc.
 */
const CORE_TABLES = [
  'folders',
  'lists',
  'tasks',
  'checklists',
  'habits',
  'habitLogs',
  'focusSessions',
  'elearningItems',
  'reminders',
  'preferences',
] as const

describe('db schema — users và userId', () => {
  it('export bảng users', () => {
    expect(schema.users).toBeDefined()
    const config = getTableConfig(schema.users)
    const names = config.columns.map((c) => c.name)
    expect(names).toContain('email')
    expect(names).toContain('phone')
    expect(names).toContain('password_hash')
    expect(names).toContain('name')
  })

  it('users có unique index cho email và phone', () => {
    const config = getTableConfig(schema.users)
    const uniqueIndexes = config.indexes.filter((i) => i.config.unique)

    const uniqueColumnNames = uniqueIndexes
      .map((i) => i.config.columns.map((c) => (c as { name?: string }).name))
      .flat()

    expect(uniqueColumnNames).toContain('email')
    expect(uniqueColumnNames).toContain('phone')
  })

  it('email và phone đều nullable để đăng nhập bằng cả hai cách', () => {
    const config = getTableConfig(schema.users)
    const email = config.columns.find((c) => c.name === 'email')
    const phone = config.columns.find((c) => c.name === 'phone')
    expect(email?.notNull).toBe(false)
    expect(phone?.notNull).toBe(false)
  })

  it.each(CORE_TABLES)('%s có userId NOT NULL trỏ tới users', (name) => {
    const table = schema[name]
    const config = getTableConfig(table)
    // `.name` của Drizzle là tên cột DB, đây cũng là hợp đồng với migration.
    const userId = config.columns.find((c) => c.name === 'user_id')

    expect(userId, `${name} thiếu cột userId`).toBeDefined()
    expect(userId?.notNull, `${name}.userId phải NOT NULL`).toBe(true)

    const referencesUsersId = config.foreignKeys.some((fk) => {
      const ref = fk.reference()
      return (
        ref.foreignTable === schema.users &&
        ref.columns.some((c) => c.name === 'user_id') &&
        ref.foreignColumns.some((c) => (c as { name?: string }).name === 'id')
      )
    })
    expect(referencesUsersId, `${name}.userId phải có foreign key tới users.id`).toBe(true)
  })

  it('preferences dùng composite key (key, userId) để nhiều user không đụng nhau', () => {
    const config = getTableConfig(schema.preferences)
    expect(config.primaryKeys.map((pk) => pk.columns.map((c) => c.name))).toEqual([
      ['key', 'user_id'],
    ])
  })
})
