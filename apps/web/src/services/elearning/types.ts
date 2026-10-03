export type ElearningItemType = 'task' | 'course'

export type ElearningItemInput = {
  course: string
  title: string
  dueAt: string | null
  url: string | null
  type: ElearningItemType
  source: 'csv' | 'ics'
  externalId: string | null
}
