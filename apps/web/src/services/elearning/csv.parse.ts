import type { ElearningItemInput, ElearningItemType } from './types'

const HEADER_ALIASES: Record<string, string> = {
  course: 'course',
  khoa_hoc: 'course',
  'khóa học': 'course',
  title: 'title',
  tieu_de: 'title',
  'tiêu đề': 'title',
  due_at: 'dueAt',
  due: 'dueAt',
  url: 'url',
  link: 'url',
  type: 'type',
}

const VALID_TYPES: ElearningItemType[] = ['task', 'course']

function splitLine(line: string): string[] {
  const cells: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      cells.push(current)
      current = ''
    } else {
      current += char
    }
  }
  cells.push(current)
  return cells.map((c) => c.trim())
}

export function parseCsv(input: string): ElearningItemInput[] {
  const lines = input
    .replace(/\uFEFF/, '')
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)

  if (lines.length === 0) return []

  const headers = splitLine(lines[0]).map((h) => HEADER_ALIASES[h.toLowerCase()] ?? h.toLowerCase())
  const rows: ElearningItemInput[] = []

  for (const line of lines.slice(1)) {
    const cells = splitLine(line)
    const record: Record<string, string> = {}
    headers.forEach((header, index) => {
      record[header] = cells[index] ?? ''
    })

    const title = (record.title ?? '').trim()
    if (!title) continue

    const rawType = (record.type ?? '').trim().toLowerCase() as ElearningItemType
    const type = VALID_TYPES.includes(rawType) ? rawType : 'task'

    rows.push({
      course: (record.course ?? '').trim(),
      title,
      dueAt: (record.dueAt ?? '').trim() || null,
      url: (record.url ?? '').trim() || null,
      type,
      source: 'csv',
      externalId: null,
    })
  }

  return rows
}
