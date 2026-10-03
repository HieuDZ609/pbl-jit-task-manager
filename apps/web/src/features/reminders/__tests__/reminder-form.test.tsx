import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReminderForm } from '../reminder-form'

describe('ReminderForm', () => {
  it('renders title, due date and repeat controls', () => {
    render(<ReminderForm onCreate={vi.fn()} />)
    expect(screen.getByLabelText(/tiêu đề/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/thời gian/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/lặp lại/i)).toBeInTheDocument()
  })

  it('rejects an empty title', async () => {
    const onCreate = vi.fn()
    render(<ReminderForm onCreate={onCreate} />)
    await userEvent.click(screen.getByRole('button', { name: /thêm nhắc nhở/i }))
    expect(await screen.findByText(/tiêu đề nhắc nhở là bắt buộc/i)).toBeInTheDocument()
    expect(onCreate).not.toHaveBeenCalled()
  })

  it('creates a reminder with the trimmed title', async () => {
    const onCreate = vi.fn()
    render(<ReminderForm onCreate={onCreate} />)
    await userEvent.type(screen.getByLabelText(/tiêu đề/i), '  Gọi mẹ  ')
    await userEvent.click(screen.getByRole('button', { name: /thêm nhắc nhở/i }))
    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Gọi mẹ', repeat: 'none' }),
    )
  })

  it('passes the selected repeat value', async () => {
    const onCreate = vi.fn()
    render(<ReminderForm onCreate={onCreate} />)
    await userEvent.type(screen.getByLabelText(/tiêu đề/i), 'Tập gym')
    await userEvent.selectOptions(screen.getByLabelText(/lặp lại/i), 'daily')
    await userEvent.click(screen.getByRole('button', { name: /thêm nhắc nhở/i }))
    expect(onCreate).toHaveBeenCalledWith(expect.objectContaining({ repeat: 'daily' }))
  })

  it('parses the due date into a Date', async () => {
    const onCreate = vi.fn()
    render(<ReminderForm onCreate={onCreate} />)
    await userEvent.type(screen.getByLabelText(/tiêu đề/i), 'A')
    await userEvent.click(screen.getByRole('button', { name: /thêm nhắc nhở/i }))
    const arg = onCreate.mock.calls[0][0]
    expect(arg.dueAt).toBeInstanceOf(Date)
  })

  it('clears the title after submit', async () => {
    render(<ReminderForm onCreate={vi.fn()} />)
    const input = screen.getByLabelText(/tiêu đề/i)
    await userEvent.type(input, 'Đọc sách')
    await userEvent.click(screen.getByRole('button', { name: /thêm nhắc nhở/i }))
    expect(input).toHaveValue('')
  })
})
