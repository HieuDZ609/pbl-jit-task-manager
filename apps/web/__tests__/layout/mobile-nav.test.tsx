import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AppLayout from '../../app/(app)/layout'

vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: { user: { name: 'Test' } } }),
}))

describe('Mobile navigation', () => {
  it('renders a menu toggle', () => {
    render(
      <AppLayout>
        <div>Test</div>
      </AppLayout>,
    )
    expect(screen.getByRole('button', { name: /mở menu/i })).toBeInTheDocument()
  })

  it('starts with the sidebar collapsed', () => {
    render(
      <AppLayout>
        <div>Test</div>
      </AppLayout>,
    )
    expect(screen.getByTestId('app-nav')).toHaveAttribute('data-open', 'false')
  })

  it('opens the sidebar when the toggle is clicked', async () => {
    render(
      <AppLayout>
        <div>Test</div>
      </AppLayout>,
    )
    await userEvent.click(screen.getByRole('button', { name: /mở menu/i }))
    expect(screen.getByTestId('app-nav')).toHaveAttribute('data-open', 'true')
  })

  it('closes the sidebar when the toggle is clicked again', async () => {
    render(
      <AppLayout>
        <div>Test</div>
      </AppLayout>,
    )
    const toggle = screen.getByRole('button', { name: /mở menu/i })
    await userEvent.click(toggle)
    await userEvent.click(screen.getByRole('button', { name: /đóng menu/i }))
    expect(screen.getByTestId('app-nav')).toHaveAttribute('data-open', 'false')
  })

  it('renders all ten nav links', () => {
    render(
      <AppLayout>
        <div>Test</div>
      </AppLayout>,
    )
    for (const label of [
      'Dashboard',
      'Tasks',
      'Matrix',
      'Calendar',
      'Focus',
      'Habits',
      'Reminders',
      'E-learning',
      'My Day',
      'Settings',
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
  })

  it('renders the page content', () => {
    render(
      <AppLayout>
        <div>Nội dung trang</div>
      </AppLayout>,
    )
    expect(screen.getByText('Nội dung trang')).toBeInTheDocument()
  })
})
