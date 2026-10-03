import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import AppLayout from '../../app/(app)/layout'

vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: { user: { name: 'Test' } } }),
}))

describe('App Shell', () => {
  it('renders sidebar links', () => {
    render(
      <AppLayout>
        <div>Test</div>
      </AppLayout>
    )
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Tasks')).toBeInTheDocument()
    expect(screen.getByText('Matrix')).toBeInTheDocument()
  })
})
