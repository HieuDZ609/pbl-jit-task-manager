import { describe, it, expect, vi, beforeEach } from 'vitest'

const revalidatePath = vi.fn()
vi.mock('next/cache', () => ({ revalidatePath: (p: string) => revalidatePath(p) }))

vi.mock('@/server/repositories', () => {
  const tasks = {
    create: vi.fn(async (input: unknown) => ({ id: 'new-task', title: (input as { title: string }).title })),
    update: vi.fn(async () => ({})),
    setDone: vi.fn(async () => ({})),
    setQuadrant: vi.fn(async () => ({})),
    softDelete: vi.fn(async () => undefined),
    setMyDay: vi.fn(async () => ({})),
    findById: vi.fn(async () => null),
    list: vi.fn(async () => []),
    listSubtasks: vi.fn(async () => []),
  }
  const checklists = { addItem: vi.fn(async () => ({})), listForTask: vi.fn(async () => []) }
  const habits = {
    create: vi.fn(async () => ({ id: 'h1' })),
    checkIn: vi.fn(async () => ({})),
    setCount: vi.fn(async () => ({})),
    archive: vi.fn(async () => undefined),
    listActive: vi.fn(async () => []),
    logsFor: vi.fn(async () => []),
  }
  const reminders = {
    create: vi.fn(async () => ({ id: 'r1' })),
    findById: vi.fn(async () => null),
    markDone: vi.fn(async () => undefined),
    reschedule: vi.fn(async () => undefined),
    remove: vi.fn(async () => undefined),
    list: vi.fn(async () => []),
  }
  const focusSessions = { record: vi.fn(async () => ({})), listSince: vi.fn(async () => []) }
  const elearning = { save: vi.fn(async () => []), list: vi.fn(async () => []) }
  return { repos: { tasks, checklists, habits, reminders, focusSessions, elearning } }
})

const { repos } = await import('@/server/repositories')
const tasks = await import('@/server/repositories/task-repository')
void tasks

const taskActions = await import('@/server/actions/task-actions')
const habitActions = await import('@/server/actions/habit-actions')
const reminderActions = await import('@/server/actions/reminder-actions')
const focusActions = await import('@/server/actions/focus-actions')
const elearningActions = await import('@/server/actions/elearning-actions')
const mydayActions = await import('@/server/actions/myday-actions')
const dashboardActions = await import('@/server/actions/dashboard-actions')

beforeEach(() => {
  vi.clearAllMocks()
})

describe('task actions', () => {
  it('creates a task', async () => {
    await taskActions.createTask('Viết báo cáo')
    expect(repos.tasks.create).toHaveBeenCalledWith(expect.objectContaining({ title: 'Viết báo cáo' }))
  })

  it('rejects an empty title', async () => {
    await expect(taskActions.createTask('   ')).rejects.toThrow()
  })

  it('sets a task done', async () => {
    await taskActions.setTaskDone('t1', true)
    expect(repos.tasks.setDone).toHaveBeenCalledWith('t1', true)
  })

  it('deletes a task', async () => {
    await taskActions.deleteTask('t1')
    expect(repos.tasks.softDelete).toHaveBeenCalledWith('t1')
  })

  it('sets a quadrant', async () => {
    await taskActions.setTaskQuadrant('t1', 'A')
    expect(repos.tasks.update).toHaveBeenCalledWith('t1', { eisenhowerQuadrant: 'A' })
  })

  it('returns the task list', async () => {
    await taskActions.getTasks()
    expect(repos.tasks.list).toHaveBeenCalled()
  })

  it('returns a smart list', async () => {
    await taskActions.getSmartList('today')
    expect(repos.tasks.list).toHaveBeenCalled()
  })
})

describe('habit actions', () => {
  it('creates a habit from valid input', async () => {
    await habitActions.createHabit({ name: 'Uống nước' })
    expect(repos.habits.create).toHaveBeenCalled()
  })

  it('rejects an invalid habit', async () => {
    await expect(habitActions.createHabit({ name: '' })).rejects.toThrow()
  })

  it('checks in a habit', async () => {
    await habitActions.checkInHabit('11111111-1111-4111-8111-111111111111')
    expect(repos.habits.checkIn).toHaveBeenCalled()
  })

  it('rejects an invalid habit id', async () => {
    await expect(habitActions.checkInHabit('nope')).rejects.toThrow()
  })

  it('undoes a check in by zeroing the count', async () => {
    await habitActions.undoHabitCheckIn('11111111-1111-4111-8111-111111111111')
    expect(repos.habits.setCount).toHaveBeenCalledWith(expect.any(String), expect.any(Date), 0)
  })

  it('archives a habit', async () => {
    await habitActions.archiveHabit('11111111-1111-4111-8111-111111111111')
    expect(repos.habits.archive).toHaveBeenCalled()
  })
})

describe('reminder actions', () => {
  it('creates a reminder', async () => {
    await reminderActions.createReminder({ title: 'Gọi mẹ', dueAt: new Date('2026-10-03T10:00:00') })
    expect(repos.reminders.create).toHaveBeenCalled()
  })

  it('rejects an invalid reminder', async () => {
    await expect(reminderActions.createReminder({ title: '' })).rejects.toThrow()
  })

  it('completes a one-off reminder without creating a successor', async () => {
    vi.mocked(repos.reminders.findById).mockResolvedValueOnce({
      id: 'r1',
      title: 'Gọi mẹ',
      dueAt: new Date('2026-10-03T10:00:00'),
      repeat: 'none',
      done: false,
      notifiedAt: null,
    })
    await reminderActions.completeReminder('r1')
    expect(repos.reminders.markDone).toHaveBeenCalledWith('r1')
    expect(repos.reminders.create).not.toHaveBeenCalled()
  })

  it('creates the next occurrence for a repeating reminder', async () => {
    vi.mocked(repos.reminders.findById).mockResolvedValueOnce({
      id: 'r1',
      title: 'Tập gym',
      dueAt: new Date('2026-10-03T10:00:00'),
      repeat: 'daily',
      done: false,
      notifiedAt: null,
    })
    await reminderActions.completeReminder('r1')
    expect(repos.reminders.create).toHaveBeenCalledWith(
      expect.objectContaining({ repeat: 'daily' }),
    )
  })

  it('throws when completing a missing reminder', async () => {
    await expect(reminderActions.completeReminder('nope')).rejects.toThrow()
  })

  it('snoozes a reminder by the default 10 minutes', async () => {
    vi.mocked(repos.reminders.findById).mockResolvedValueOnce({
      id: 'r1',
      title: 'Gọi mẹ',
      dueAt: new Date('2026-10-03T10:00:00'),
      repeat: 'none',
      done: false,
      notifiedAt: null,
    })
    await reminderActions.snoozeReminder('r1')
    expect(repos.reminders.reschedule).toHaveBeenCalledWith('r1', expect.any(Date))
  })

  it('throws when snoozing a missing reminder', async () => {
    await expect(reminderActions.snoozeReminder('nope')).rejects.toThrow()
  })

  it('deletes a reminder', async () => {
    await reminderActions.deleteReminder('r1')
    expect(repos.reminders.remove).toHaveBeenCalledWith('r1')
  })
})

describe('focus actions', () => {
  it('records a focus session', async () => {
    await focusActions.logFocusSession({ mode: 'work', minutes: 25, completed: true })
    expect(repos.focusSessions.record).toHaveBeenCalledWith(
      expect.objectContaining({ mode: 'work', durationMin: 25 }),
    )
  })

  it('records a session through saveFocusSession', async () => {
    await focusActions.saveFocusSession({ mode: 'break', minutes: 5, completed: true })
    expect(repos.focusSessions.record).toHaveBeenCalledWith(
      expect.objectContaining({ mode: 'break', durationMin: 5 }),
    )
  })
})

describe('elearning actions', () => {
  it('saves imported items', async () => {
    const items = [
      { course: 'PBL', title: 'A', dueAt: null, url: null, type: 'task' as const, source: 'csv' as const, externalId: null },
    ]
    await elearningActions.importElearningItems(items)
    expect(repos.elearning.save).toHaveBeenCalledWith(items)
  })

  it('rejects a non-array payload', async () => {
    await expect(
      elearningActions.importElearningItems('nope' as unknown as never),
    ).rejects.toThrow()
  })
})

describe('my day actions', () => {
  it('quick adds a task pinned to today', async () => {
    await mydayActions.quickAddToMyDay('Học PBL')
    expect(repos.tasks.create).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Học PBL', myDayAt: expect.any(Date) }),
    )
  })

  it('rejects an empty quick add', async () => {
    await expect(mydayActions.quickAddToMyDay('')).rejects.toThrow()
  })

  it('toggles a task to done', async () => {
    vi.mocked(repos.tasks.findById).mockResolvedValueOnce({ id: 't1', isDone: false } as never)
    await mydayActions.toggleMyDayTask('t1')
    expect(repos.tasks.setDone).toHaveBeenCalledWith('t1', true)
  })

  it('toggles a done task back to open', async () => {
    vi.mocked(repos.tasks.findById).mockResolvedValueOnce({ id: 't1', isDone: true } as never)
    await mydayActions.toggleMyDayTask('t1')
    expect(repos.tasks.setDone).toHaveBeenCalledWith('t1', false)
  })

  it('throws for a missing task', async () => {
    await expect(mydayActions.toggleMyDayTask('nope')).rejects.toThrow()
  })
})

describe('dashboard actions', () => {
  it('returns stats computed from repositories', async () => {
    const stats = await dashboardActions.loadStats(new Date('2026-10-03T09:00:00'))
    expect(stats).toHaveProperty('completedToday', 0)
    expect(stats.quadrants).toEqual({ A: 0, B: 0, C: 0, D: 0 })
  })
})
