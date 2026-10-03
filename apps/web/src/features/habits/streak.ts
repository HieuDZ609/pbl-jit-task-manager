export function toDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function shiftDays(d: Date, days: number): Date {
  const copy = new Date(d)
  copy.setDate(copy.getDate() + days)
  return copy
}

export function currentStreak(dateKeys: string[], today: Date): number {
  const set = new Set(dateKeys)
  if (set.size === 0) return 0

  const todayKey = toDateKey(today)
  const yesterdayKey = toDateKey(shiftDays(today, -1))
  if (!set.has(todayKey) && !set.has(yesterdayKey)) return 0

  let cursor = set.has(todayKey) ? today : shiftDays(today, -1)
  let count = 0
  while (set.has(toDateKey(cursor))) {
    count += 1
    cursor = shiftDays(cursor, -1)
  }
  return count
}

export function longestStreak(dateKeys: string[]): number {
  const unique = [...new Set(dateKeys)].sort()
  if (unique.length === 0) return 0

  let best = 1
  let run = 1
  for (let i = 1; i < unique.length; i += 1) {
    const prev = new Date(`${unique[i - 1]}T00:00:00`)
    const expected = toDateKey(shiftDays(prev, 1))
    if (unique[i] === expected) {
      run += 1
      best = Math.max(best, run)
    } else {
      run = 1
    }
  }
  return best
}

export type HeatmapCell = {
  dateKey: string
  count: number
  level: 0 | 1 | 2 | 3 | 4
}

const MAX_LEVEL = 4

export function buildHeatmap(dateKeys: string[], days: number, today: Date): HeatmapCell[] {
  const counts = new Map<string, number>()
  for (const key of dateKeys) {
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  const cells: HeatmapCell[] = []
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = shiftDays(today, -offset)
    const key = toDateKey(date)
    const count = counts.get(key) ?? 0
    const level = count === 0 ? 0 : Math.min(MAX_LEVEL, count) as HeatmapCell['level']
    cells.push({ dateKey: key, count, level })
  }
  return cells
}

export function completionRate(count: number, target: number): number {
  if (target <= 0) return 0
  return Math.min(100, Math.round((count / target) * 100))
}
