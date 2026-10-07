import { describe, it, expect, vi, beforeEach } from 'vitest'
import { resetInMemoryRepos } from '@/server/repositories/__tests__/in-memory-bundle'

// Mock auth
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/server/repositories', async () => {
  const { mockInMemoryRepos } = await import(
    '@/server/repositories/__tests__/in-memory-bundle'
  )
  return mockInMemoryRepos()()
})


// Mock redirect
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import DashboardPage from '../../app/(app)/dashboard/page'

describe('Protected route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetInMemoryRepos()
  })

  it('redirects unauthenticated user to signin', async () => {
    ;(auth as any).mockResolvedValue(null)
    await DashboardPage()
    expect(redirect).toHaveBeenCalledWith('/login')
  })
})
