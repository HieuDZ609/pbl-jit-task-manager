import type { ElearningItemInput } from './types'

export function dedupeKey(item: ElearningItemInput): string {
  if (item.externalId) return `${item.source}:${item.externalId}`
  return `${item.source}:${item.title}|${item.dueAt ?? ''}`
}

export function dedupeItems(
  incoming: ElearningItemInput[],
  existing: ElearningItemInput[] = [],
): ElearningItemInput[] {
  const seen = new Set(existing.map(dedupeKey))
  const result: ElearningItemInput[] = []

  for (const item of incoming) {
    const key = dedupeKey(item)
    if (seen.has(key)) continue
    seen.add(key)
    result.push(item)
  }

  return result
}
