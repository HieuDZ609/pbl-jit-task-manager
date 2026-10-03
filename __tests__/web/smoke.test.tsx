import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import HomePage from '@/app/page'

describe('Home', () => {
  it('renders home page', () => {
    render(<HomePage />)
    expect(screen.getByText(/PBL JIT Task/i)).toBeInTheDocument()
  })
})
