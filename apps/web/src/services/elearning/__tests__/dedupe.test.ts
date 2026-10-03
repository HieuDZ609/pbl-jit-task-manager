import { describe, it, expect } from 'vitest'
import { dedupeItems, dedupeKey } from '../dedupe'
import type { ElearningItemInput } from '../types'

function item(overrides: Partial<ElearningItemInput> = {}): ElearningItemInput {
  return {
    course: 'PBL',
    title: 'Làm PBL',
    dueAt: '2026-10-10T09:00:00.000Z',
    url: null,
    type: 'task',
    source: 'csv',
    externalId: null,
    ...overrides,
  }
}

describe('dedupeKey', () => {
  it('uses external id when the item has one', () => {
    expect(dedupeKey(item({ source: 'ics', externalId: 'evt-1' }))).toBe('ics:evt-1')
  })

  it('falls back to title and due date', () => {
    expect(dedupeKey(item())).toBe('csv:Làm PBL|2026-10-10T09:00:00.000Z')
  })

  it('treats a null due date as an empty segment', () => {
    expect(dedupeKey(item({ dueAt: null }))).toBe('csv:Làm PBL|')
  })
})

describe('dedupeItems', () => {
  it('keeps every distinct item', () => {
    const items = [item({ title: 'A' }), item({ title: 'B' })]
    expect(dedupeItems(items)).toHaveLength(2)
  })

  it('drops an exact duplicate', () => {
    const items = [item(), item()]
    expect(dedupeItems(items)).toHaveLength(1)
  })

  it('keeps the first occurrence', () => {
    const items = [item({ title: 'Bản đầu' }), item({ title: 'Bản đầu' })]
    expect(dedupeItems(items)[0].title).toBe('Bản đầu')
  })

  it('keeps different sources with the same title', () => {
    const items = [item({ source: 'csv' }), item({ source: 'ics' })]
    expect(dedupeItems(items)).toHaveLength(2)
  })

  it('dedupes by external id when available', () => {
    const items = [
      item({ source: 'ics', externalId: 'evt-1', title: 'A' }),
      item({ source: 'ics', externalId: 'evt-1', title: 'B' }),
    ]
    expect(dedupeItems(items)).toHaveLength(1)
  })

  it('keeps two ICS items with different UIDs', () => {
    const items = [
      item({ source: 'ics', externalId: 'evt-1', title: 'A' }),
      item({ source: 'ics', externalId: 'evt-2', title: 'A' }),
    ]
    expect(dedupeItems(items)).toHaveLength(2)
  })

  it('dedupes against previously imported items', () => {
    const existing = [item({ title: 'Làm PBL' })]
    const incoming = [item({ title: 'Làm PBL' }), item({ title: 'Mới' })]
    expect(dedupeItems(incoming, existing)).toHaveLength(1)
  })

  it('is case and whitespace sensitive on title', () => {
    const items = [item({ title: 'Làm PBL' }), item({ title: 'làm pbl' })]
    expect(dedupeItems(items)).toHaveLength(2)
  })

  it('treats items with the same title but different due dates as distinct', () => {
    const items = [item({ dueAt: '2026-10-10T09:00:00.000Z' }), item({ dueAt: '2026-10-11T09:00:00.000Z' })]
    expect(dedupeItems(items)).toHaveLength(2)
  })

  it('does not mutate the input array', () => {
    const items = [item(), item()]
    dedupeItems(items)
    expect(items).toHaveLength(2)
  })

  it('returns an empty array for empty input', () => {
    expect(dedupeItems([])).toEqual([])
  })
})
