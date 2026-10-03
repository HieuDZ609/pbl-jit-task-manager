import { describe, it, expect } from 'vitest'
import { MODES, modeDuration, nextMode, describeSession } from '../pomodoro'

describe('MODES', () => {
  it('has work, break, longBreak', () => {
    expect(MODES).toEqual(['work', 'break', 'longBreak'])
  })
})

describe('modeDuration', () => {
  it('work is 25 minutes', () => {
    expect(modeDuration('work')).toBe(25)
  })

  it('break is 5 minutes', () => {
    expect(modeDuration('break')).toBe(5)
  })

  it('longBreak is 15 minutes', () => {
    expect(modeDuration('longBreak')).toBe(15)
  })
})

describe('nextMode', () => {
  it('work goes to break', () => {
    expect(nextMode('work', 1)).toBe('break')
  })

  it('break goes back to work', () => {
    expect(nextMode('break', 1)).toBe('work')
  })

  it('every 4th work goes to longBreak', () => {
    expect(nextMode('work', 4)).toBe('longBreak')
  })

  it('longBreak goes to work', () => {
    expect(nextMode('longBreak', 4)).toBe('work')
  })

  it('work count 8 also longBreak', () => {
    expect(nextMode('work', 8)).toBe('longBreak')
  })
})

describe('describeSession', () => {
  it('describes a completed work session', () => {
    expect(describeSession('work', 25, true)).toMatch(/tập trung/i)
  })

  it('marks aborted session', () => {
    expect(describeSession('work', 10, false)).toMatch(/dở/i)
  })
})
