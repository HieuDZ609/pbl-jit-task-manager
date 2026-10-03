import { describe, it, expect } from 'vitest'
import { parseIcs } from '../ics.parse'

const wrap = (body: string) => `BEGIN:VCALENDAR\r\nVERSION:2.0\r\n${body}\r\nEND:VCALENDAR`

describe('parseIcs', () => {
  it('returns an empty array for empty input', () => {
    expect(parseIcs('')).toEqual([])
  })

  it('parses one VEVENT', () => {
    const items = parseIcs(
      wrap('BEGIN:VEVENT\r\nUID:evt-1\r\nSUMMARY:Làm PBL\r\nDTSTART:20261010T090000Z\r\nEND:VEVENT'),
    )
    expect(items).toHaveLength(1)
    expect(items[0].title).toBe('Làm PBL')
  })

  it('parses multiple VEVENTs', () => {
    const items = parseIcs(
      wrap(
        'BEGIN:VEVENT\r\nUID:a\r\nSUMMARY:A\r\nEND:VEVENT\r\nBEGIN:VEVENT\r\nUID:b\r\nSUMMARY:B\r\nEND:VEVENT',
      ),
    )
    expect(items.map((i) => i.title)).toEqual(['A', 'B'])
  })

  it('takes the UID as the external id', () => {
    const items = parseIcs(wrap('BEGIN:VEVENT\r\nUID:evt-42\r\nSUMMARY:A\r\nEND:VEVENT'))
    expect(items[0].externalId).toBe('evt-42')
  })

  it('converts DTSTART to an ISO string', () => {
    const items = parseIcs(
      wrap('BEGIN:VEVENT\r\nUID:a\r\nSUMMARY:A\r\nDTSTART:20261010T090000Z\r\nEND:VEVENT'),
    )
    expect(items[0].dueAt).toBe('2026-10-10T09:00:00.000Z')
  })

  it('ignores an invalid DTSTART and yields null dueAt', () => {
    const items = parseIcs(
      wrap('BEGIN:VEVENT\r\nUID:a\r\nSUMMARY:A\r\nDTSTART:không-hợp-lệ\r\nEND:VEVENT'),
    )
    expect(items[0].dueAt).toBeNull()
  })

  it('reads URL', () => {
    const items = parseIcs(
      wrap('BEGIN:VEVENT\r\nUID:a\r\nSUMMARY:A\r\nURL:https://a.dev/course\r\nEND:VEVENT'),
    )
    expect(items[0].url).toBe('https://a.dev/course')
  })

  it('uses CATEGORIES as the course', () => {
    const items = parseIcs(
      wrap('BEGIN:VEVENT\r\nUID:a\r\nSUMMARY:A\r\nCATEGORIES:PBL\r\nEND:VEVENT'),
    )
    expect(items[0].course).toBe('PBL')
  })

  it('handles folded SUMMARY lines', () => {
    const items = parseIcs(
      wrap('BEGIN:VEVENT\r\nUID:a\r\nSUMMARY:Làm\r\n PBL\r\nEND:VEVENT'),
    )
    expect(items[0].title).toBe('LàmPBL')
  })

  it('skips a VEVENT without SUMMARY', () => {
    const items = parseIcs(wrap('BEGIN:VEVENT\r\nUID:a\r\nDTSTART:20261010T090000Z\r\nEND:VEVENT'))
    expect(items).toEqual([])
  })

  it('strips a fully qualified VTIMEZONE TZID prefix', () => {
    const items = parseIcs(
      wrap('BEGIN:VEVENT\r\nUID:a\r\nSUMMARY:A\r\nDTSTART;TZID=Asia/Ho_Chi_Minh:20261010T090000\r\nEND:VEVENT'),
    )
    expect(items[0].dueAt).toBe('2026-10-10T09:00:00.000Z')
  })

  it('marks the source as ics', () => {
    const items = parseIcs(wrap('BEGIN:VEVENT\r\nUID:a\r\nSUMMARY:A\r\nEND:VEVENT'))
    expect(items[0].source).toBe('ics')
  })

  it('defaults type to task', () => {
    const items = parseIcs(wrap('BEGIN:VEVENT\r\nUID:a\r\nSUMMARY:A\r\nEND:VEVENT'))
    expect(items[0].type).toBe('task')
  })

  it('treats a SUMMARY containing PBL as course type', () => {
    const items = parseIcs(wrap('BEGIN:VEVENT\r\nUID:a\r\nSUMMARY:Khoá học PBL\r\nEND:VEVENT'))
    expect(items[0].type).toBe('course')
  })

  it('defaults course to an empty string when CATEGORIES is absent', () => {
    const items = parseIcs(wrap('BEGIN:VEVENT\r\nUID:a\r\nSUMMARY:A\r\nEND:VEVENT'))
    expect(items[0].course).toBe('')
  })

  it('handles LF-only line endings', () => {
    const items = parseIcs('BEGIN:VCALENDAR\nBEGIN:VEVENT\nUID:a\nSUMMARY:A\nEND:VEVENT\nEND:VCALENDAR')
    expect(items).toHaveLength(1)
  })
})
