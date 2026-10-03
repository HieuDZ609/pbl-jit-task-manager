import type { ElearningItemInput } from './types'

type RawLine = { key: string; value: string }

/** Unfolds RFC 5545 continuation lines (a leading space continues the previous line). */
function unfold(content: string): string[] {
  const raw = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  const lines: string[] = []
  for (const line of raw) {
    if ((line.startsWith(' ') || line.startsWith('\t')) && lines.length > 0) {
      lines[lines.length - 1] += line.slice(1)
    } else if (line.length > 0) {
      lines.push(line)
    }
  }
  return lines
}

function parseLine(line: string): RawLine | null {
  const colon = line.indexOf(':')
  if (colon === -1) return null
  const left = line.slice(0, colon)
  const value = line.slice(colon + 1).trim()
  const key = left.split(';')[0].trim().toUpperCase()
  return { key, value }
}

const DTSTART_FORMATS: RegExp[] = [
  /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/,
  /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})$/,
  /^(\d{4})(\d{2})(\d{2})$/,
]

function toIso(value: string): string | null {
  for (const pattern of DTSTART_FORMATS) {
    const m = pattern.exec(value)
    if (!m) continue
    const [, y, mo, d, h = '00', mi = '00', s = '00'] = m
    const date = new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s)))
    if (Number.isNaN(date.getTime())) return null
    return date.toISOString()
  }
  return null
}

export function parseIcs(input: string): ElearningItemInput[] {
  const lines = unfold(input)
  const items: ElearningItemInput[] = []

  let inside = false
  let fields: Record<string, string> = {}

  const flush = () => {
    const summary = (fields.SUMMARY ?? '').trim()
    if (!summary) {
      fields = {}
      return
    }
    const rawDue = (fields.DTSTART ?? '').trim()
    items.push({
      course: (fields.CATEGORIES ?? '').split(',')[0].trim(),
      title: summary,
      dueAt: rawDue ? toIso(rawDue) : null,
      url: (fields.URL ?? '').trim() || null,
      type: /pbl/i.test(summary) ? 'course' : 'task',
      source: 'ics',
      externalId: (fields.UID ?? '').trim() || null,
    })
    fields = {}
  }

  for (const line of lines) {
    if (line.trim() === 'BEGIN:VEVENT') {
      inside = true
      fields = {}
      continue
    }
    if (line.trim() === 'END:VEVENT') {
      if (inside) flush()
      inside = false
      continue
    }
    if (!inside) continue
    const parsed = parseLine(line)
    if (parsed && parsed.key === 'CATEGORIES') {
      fields.CATEGORIES = parsed.value
    } else if (parsed) {
      fields[parsed.key] = parsed.value
    }
  }

  return items
}
