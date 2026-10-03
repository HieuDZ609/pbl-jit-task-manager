import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AddTaskForm } from '../add-task-form'

describe('AddTaskForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls onCreate with the typed title', async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined)
    render(<AddTaskForm onCreate={onCreate} />)
    await userEvent.type(screen.getByLabelText(/title/i), 'Làm bài PBL')
    await userEvent.click(screen.getByRole('button', { name: /add/i }))
    await waitFor(() => expect(onCreate).toHaveBeenCalledWith('Làm bài PBL'))
  })

  it('clears input after create', async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined)
    render(<AddTaskForm onCreate={onCreate} />)
    const input = screen.getByLabelText(/title/i)
    await userEvent.type(input, 'X')
    await userEvent.click(screen.getByRole('button', { name: /add/i }))
    await waitFor(() => expect(input).toHaveValue(''))
  })

  it('does not submit empty title', async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined)
    render(<AddTaskForm onCreate={onCreate} />)
    await userEvent.click(screen.getByRole('button', { name: /add/i }))
    expect(onCreate).not.toHaveBeenCalled()
  })
})
