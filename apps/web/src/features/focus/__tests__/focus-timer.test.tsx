import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FocusTimer } from '../focus-timer'

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('FocusTimer', () => {
  it('starts in work mode with 25 minutes', () => {
    render(<FocusTimer onSessionComplete={vi.fn()} />)
    expect(screen.getByTestId('timer-display')).toHaveTextContent('25:00')
  })

  it('counts down after start', () => {
    render(<FocusTimer onSessionComplete={vi.fn()} />)
    act(() => {
      screen.getByRole('button', { name: /bắt đầu/i }).click()
    })
    act(() => {
      vi.advanceTimersByTime(60_000)
    })
    expect(screen.getByTestId('timer-display')).toHaveTextContent('24:00')
  })

  it('fires onSessionComplete when reaching zero', () => {
    const onComplete = vi.fn()
    render(<FocusTimer onSessionComplete={onComplete} />)
    act(() => {
      screen.getByRole('button', { name: /bắt đầu/i }).click()
    })
    act(() => {
      vi.advanceTimersByTime(25 * 60_000)
    })
    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({ mode: 'work', completed: true }))
  })

  it('pause stops the countdown', () => {
    render(<FocusTimer onSessionComplete={vi.fn()} />)
    act(() => {
      screen.getByRole('button', { name: /bắt đầu/i }).click()
    })
    act(() => {
      vi.advanceTimersByTime(60_000)
    })
    act(() => {
      screen.getByRole('button', { name: /tạm dừng/i }).click()
    })
    act(() => {
      vi.advanceTimersByTime(120_000)
    })
    expect(screen.getByTestId('timer-display')).toHaveTextContent('24:00')
  })

  it('reset restores full duration', () => {
    render(<FocusTimer onSessionComplete={vi.fn()} />)
    act(() => {
      screen.getByRole('button', { name: /bắt đầu/i }).click()
    })
    act(() => {
      vi.advanceTimersByTime(60_000)
    })
    act(() => {
      screen.getByRole('button', { name: /đặt lại/i }).click()
    })
    expect(screen.getByTestId('timer-display')).toHaveTextContent('25:00')
  })

  it('switches to break after a completed work session', () => {
    render(<FocusTimer onSessionComplete={vi.fn()} />)
    act(() => {
      screen.getByRole('button', { name: /bắt đầu/i }).click()
    })
    act(() => {
      vi.advanceTimersByTime(25 * 60_000)
    })
    expect(screen.getByTestId('mode-label')).toHaveTextContent(/nghỉ/i)
  })

  it('does not fire onSessionComplete when aborted', () => {
    const onComplete = vi.fn()
    render(<FocusTimer onSessionComplete={onComplete} />)
    act(() => {
      screen.getByRole('button', { name: /bắt đầu/i }).click()
    })
    act(() => {
      vi.advanceTimersByTime(60_000)
    })
    act(() => {
      screen.getByRole('button', { name: /đặt lại/i }).click()
    })
    expect(onComplete).not.toHaveBeenCalled()
  })
})
