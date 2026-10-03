import { describe, it, expect } from 'vitest'
import { parseCsv } from '../csv.parse'

describe('parseCsv', () => {
  it('parses the header row and one data row', () => {
    const rows = parseCsv('course,title,due_at,url,type\nPBL,Làm PBL,2026-10-10,https://a.dev,course')
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ course: 'PBL', title: 'Làm PBL', dueAt: '2026-10-10', type: 'course' })
  })

  it('parses multiple rows', () => {
    const rows = parseCsv('course,title\nA,One\nB,Two')
    expect(rows.map((r) => r.title)).toEqual(['One', 'Two'])
  })

  it('tolerates missing optional columns', () => {
    const rows = parseCsv('title\nChỉ có tiêu đề')
    expect(rows[0].title).toBe('Chỉ có tiêu đề')
  })

  it('skips rows with an empty title', () => {
    const rows = parseCsv('course,title\nPBL,\nPBL,Hợp lệ')
    expect(rows).toHaveLength(1)
  })

  it('returns an empty array for empty input', () => {
    expect(parseCsv('')).toEqual([])
  })

  it('handles CRLF line endings', () => {
    const rows = parseCsv('course,title\r\nPBL,Làm PBL')
    expect(rows[0].title).toBe('Làm PBL')
  })

  it('handles quoted fields containing commas', () => {
    const rows = parseCsv('course,title\nPBL,"Làm, PBL"')
    expect(rows[0].title).toBe('Làm, PBL')
  })

  it('handles a UTF-8 BOM on the first header', () => {
    const rows = parseCsv('\uFEFFcourse,title\nPBL,Làm PBL')
    expect(rows[0].course).toBe('PBL')
  })

  it('defaults a missing type to task', () => {
    const rows = parseCsv('course,title\nPBL,Làm PBL')
    expect(rows[0].type).toBe('task')
  })

  it('normalizes an unknown type to task', () => {
    const rows = parseCsv('course,title,type\nPBL,Làm PBL,bogus')
    expect(rows[0].type).toBe('task')
  })

  it('keeps the url when present', () => {
    const rows = parseCsv('course,title,url\nPBL,Làm PBL,https://a.dev')
    expect(rows[0].url).toBe('https://a.dev')
  })
})
