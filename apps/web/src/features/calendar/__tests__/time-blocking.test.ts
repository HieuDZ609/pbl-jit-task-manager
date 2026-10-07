import { describe, it, expect } from 'vitest'
import {
  blockTask,
  buildHourSlots,
  tasksForDay,
  unblockTask,
  startOfWeek,
  addDays,
  addMonths,
  startOfMonth,
  weekDates,
  monthGridDates,
  dateKey,
  formatDate,
  formatDayLabel,
  formatMonthLabel,
} from '../time-blocking'

const day = new Date('2026-10-03T00:00:00')

describe('buildHourSlots', () => {
  it('builds 24 hourly slots', () => {
    expect(buildHourSlots()).toHaveLength(24)
  })

  it('labels slots 00 to 23', () => {
    const slots = buildHourSlots()
    expect(slots[0].label).toBe('00:00')
    expect(slots[23].label).toBe('23:00')
  })
})

describe('blockTask', () => {
  const base = [{ id: '1', title: 'A', isDone: false, startAt: null, dueAt: null }]

  it('sets startAt and dueAt from a slot', () => {
    const [t] = blockTask(base as never, '1', 9, 60, day)
    expect(t.startAt?.getHours()).toBe(9)
    expect(t.dueAt?.getHours()).toBe(10)
  })

  it('spans multiple hours for long duration', () => {
    const [t] = blockTask(base as never, '1', 9, 180, day)
    expect(t.dueAt?.getHours()).toBe(12)
  })

  it('ignores unknown task id', () => {
    expect(blockTask(base as never, 'zz', 9, 60, day)).toBe(base)
  })

  it('wraps past midnight to next day', () => {
    const [t] = blockTask(base as never, '1', 23, 120, day)
    expect(t.dueAt?.getDate()).toBe(4)
  })
})

describe('unblockTask', () => {
  it('clears startAt and dueAt', () => {
    const withBlock = [{ id: '1', title: 'A', isDone: false, startAt: new Date(), dueAt: new Date() }]
    const [t] = unblockTask(withBlock as never, '1')
    expect(t.startAt).toBeNull()
    expect(t.dueAt).toBeNull()
  })
})

describe('startOfWeek', () => {
  const case_ = (input: string) => startOfWeek(new Date(input)).toISOString()

  it('trả về thứ Hai 00:00 của tuần chứa ngày đã cho (thứ Bảy)', () => {
    expect(case_('2026-10-03T15:30:00')).toBe(
      new Date('2026-09-28T00:00:00').toISOString(),
    )
  })

  it('coi Chủ Nhật là ngày cuối tuần, không phải đầu tuần', () => {
    expect(case_('2026-10-04T10:00:00')).toBe(
      new Date('2026-09-28T00:00:00').toISOString(),
    )
  })

  it('giữ nguyên khi đã là thứ Hai', () => {
    expect(case_('2026-09-28T08:00:00')).toBe(
      new Date('2026-09-28T00:00:00').toISOString(),
    )
  })
})

describe('date helpers', () => {
  it('cộng/trừ ngày', () => {
    expect(addDays(new Date('2026-10-03T00:00:00'), 1).getDate()).toBe(4)
    expect(addDays(new Date('2026-10-01T00:00:00'), -1).getDate()).toBe(30)
  })

  it('cộng tháng vượt qua năm', () => {
    const d = addMonths(new Date('2026-12-15T00:00:00'), 1)
    expect(d.getFullYear()).toBe(2027)
    expect(d.getMonth()).toBe(0)
  })

  it('đầu tháng luôn là ngày 1', () => {
    const d = startOfMonth(new Date('2026-10-25T00:00:00'))
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(9)
    expect(d.getDate()).toBe(1)
  })
})

describe('weekDates', () => {
  it('trả 7 ngày từ thứ Hai đến Chủ Nhật', () => {
    const dates = weekDates(new Date('2026-10-03T00:00:00'))
    expect(dates).toHaveLength(7)
    expect(dateKey(dates[0])).toBe('2026-09-28')
    expect(dateKey(dates[3])).toBe('2026-10-01')
    expect(dateKey(dates[6])).toBe('2026-10-04')
    expect(isMondayToSunday(dates)).toBe(true)
  })
})

describe('monthGridDates', () => {
  it('trả lưới 6×7 phủ cả tháng', () => {
    const dates = monthGridDates(new Date('2026-10-15T00:00:00'))
    expect(dates).toHaveLength(42)
    expect(dateKey(dates[0])).toBe('2026-09-28')
    expect(dateKey(dates[41])).toBe('2026-11-08')
    expect(dates.some((d) => dateKey(d) === '2026-10-01')).toBe(true)
    expect(dates.some((d) => dateKey(d) === '2026-10-31')).toBe(true)
    expect(isMondayToSunday(dates)).toBe(true)
  })

  it('đặt ngày 1 của tháng vào đúng cột (10/2026: thứ Năm → index 3)', () => {
    const dates = monthGridDates(new Date('2026-10-15T00:00:00'))
    const first = dates.findIndex((d) => d.getDate() === 1)
    expect(first).toBe(3)
  })
})

function isMondayToSunday(dates: Date[]): boolean {
  return dates.every((d, i) => d.getDay() === (i + 1) % 7)
}

describe('formatting', () => {
  it('dateKey/formatDate/formatDayLabel/formatMonthLabel', () => {
    expect(dateKey(new Date('2026-10-05T00:00:00'))).toBe('2026-10-05')
    expect(formatDate(new Date('2026-10-05T00:00:00'))).toBe('05/10/2026')
    expect(formatDayLabel(new Date('2026-10-05T00:00:00'))).toBe('Thứ Hai, 05/10/2026')
    expect(formatMonthLabel(new Date('2026-10-05T09:00:00'))).toBe('Tháng 10, 2026')
  })
})

describe('tasksForDay', () => {
  it('returns tasks whose block falls on the day', () => {
    const tasks = [
      { id: '1', title: 'A', isDone: false, startAt: new Date('2026-10-03T09:00:00'), dueAt: null },
      { id: '2', title: 'B', isDone: false, startAt: new Date('2026-10-04T09:00:00'), dueAt: null },
      { id: '3', title: 'C', isDone: false, startAt: null, dueAt: new Date('2026-10-03T18:00:00') },
    ]
    expect(tasksForDay(tasks as never, day).map((t) => t.id).sort()).toEqual(['1', '3'])
  })

  it('ignores deleted tasks', () => {
    const tasks = [
      { id: '1', title: 'A', isDone: false, startAt: new Date('2026-10-03T09:00:00'), deletedAt: new Date() },
    ]
    expect(tasksForDay(tasks as never, day)).toEqual([])
  })

  it('spans a task that starts before and ends after the day', () => {
    const tasks = [
      { id: '1', title: 'A', isDone: false, startAt: new Date('2026-10-02T22:00:00'), dueAt: new Date('2026-10-03T03:00:00') },
    ]
    expect(tasksForDay(tasks as never, day)).toHaveLength(1)
  })
})
