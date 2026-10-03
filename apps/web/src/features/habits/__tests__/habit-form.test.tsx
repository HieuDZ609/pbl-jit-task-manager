import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HabitForm } from '../habit-form'

describe('HabitForm', () => {
  it('renders a name field', () => {
    render(<HabitForm onCreate={vi.fn()} />)
    expect(screen.getByLabelText(/tên thói quen/i)).toBeInTheDocument()
  })

  it('renders a submit button', () => {
    render(<HabitForm onCreate={vi.fn()} />)
    expect(screen.getByRole('button', { name: /thêm/i })).toBeInTheDocument()
  })

  it('calls onCreate with the trimmed name', async () => {
    const onCreate = vi.fn()
    render(<HabitForm onCreate={onCreate} />)
    await userEvent.type(screen.getByLabelText(/tên thói quen/i), '  Uống nước  ')
    await userEvent.click(screen.getByRole('button', { name: /thêm/i }))
    expect(onCreate).toHaveBeenCalledWith('Uống nước')
  })

  it('does not submit an empty name', async () => {
    const onCreate = vi.fn()
    render(<HabitForm onCreate={onCreate} />)
    await userEvent.click(screen.getByRole('button', { name: /thêm/i }))
    expect(onCreate).not.toHaveBeenCalled()
  })

  it('shows a validation error for whitespace only', async () => {
    render(<HabitForm onCreate={vi.fn()} />)
    await userEvent.type(screen.getByLabelText(/tên thói quen/i), '   ')
    await userEvent.click(screen.getByRole('button', { name: /thêm/i }))
    expect(await screen.findByText(/tên thói quen là bắt buộc/i)).toBeInTheDocument()
  })

  it('clears the field after a successful submit', async () => {
    render(<HabitForm onCreate={vi.fn()} />)
    const input = screen.getByLabelText(/tên thói quen/i)
    await userEvent.type(input, 'Đọc sách')
    await userEvent.click(screen.getByRole('button', { name: /thêm/i }))
    expect(input).toHaveValue('')
  })
})
