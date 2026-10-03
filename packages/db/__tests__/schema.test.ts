import { describe, it, expect } from 'vitest'
import * as schema from '../src/schema'

describe('db schema', () => {
  it('exports required tables', () => {
    expect(schema.folders).toBeDefined()
    expect(schema.lists).toBeDefined()
    expect(schema.tasks).toBeDefined()
    expect(schema.checklists).toBeDefined()
    expect(schema.habits).toBeDefined()
    expect(schema.habitLogs).toBeDefined()
    expect(schema.focusSessions).toBeDefined()
    expect(schema.elearningItems).toBeDefined()
    expect(schema.reminders).toBeDefined()
    expect(schema.preferences).toBeDefined()
  })
})
