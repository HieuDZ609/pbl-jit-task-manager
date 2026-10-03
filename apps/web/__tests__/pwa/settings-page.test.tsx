import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import SettingsPage from '../../app/(app)/settings/page'

describe('Settings page', () => {
  it('renders a settings heading', async () => {
    render(await SettingsPage())
    expect(screen.getByText(/cài đặt/i)).toBeInTheDocument()
  })

  it('renders without crashing', () => {
    expect(() => render(<SettingsPage />)).not.toThrow()
  })
})
