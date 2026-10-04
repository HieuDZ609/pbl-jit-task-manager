'use server'

import { currentRepos } from '@/server/repositories'
import { computeStats, type Stats } from '@/features/dashboard/stats'

export async function loadStats(now: Date): Promise<Stats> {
  const repos = await currentRepos()
  const [tasks, focusSessions, habits] = await Promise.all([
    repos.tasks.list(),
    repos.focusSessions.listSince(new Date(now.getFullYear(), now.getMonth(), now.getDate())),
    repos.habits.listActive(),
  ])

  const habitLogs: Record<string, Awaited<ReturnType<typeof repos.habits.logsFor>>> = {}
  for (const habit of habits) {
    habitLogs[habit.id] = await repos.habits.logsFor(habit.id)
  }

  return computeStats({ tasks, focusSessions, habits, habitLogs }, now)
}
