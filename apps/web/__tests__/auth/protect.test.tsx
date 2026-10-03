import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock auth
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

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
  })

  it('redirects unauthenticated user to signin', async () => {
    ;(auth as any).mockResolvedValue(null)
    await DashboardPage()
    expect(redirect).toHaveBeenCalledWith('/login')
  })
})
