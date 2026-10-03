import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WhiteNoisePlayer } from '../white-noise'

const created: { src: string; play: ReturnType<typeof vi.fn>; pause: ReturnType<typeof vi.fn> }[] = []

afterEach(() => {
  created.length = 0
  vi.restoreAllMocks()
})

describe('WhiteNoisePlayer default audio factory', () => {
  it('creates an Audio element for the selected sound', async () => {
    const spy = vi.spyOn(globalThis, 'Audio' as never).mockImplementation(((src: string) => {
      const audio = {
        loop: false,
        volume: 1,
        play: vi.fn().mockResolvedValue(undefined),
        pause: vi.fn(),
      }
      created.push({ src: String(src), play: audio.play, pause: audio.pause })
      return audio as never
    }) as never)

    render(<WhiteNoisePlayer />)
    await userEvent.click(screen.getByRole('button', { name: /mưa/i }))

    expect(spy).toHaveBeenCalledWith('/sounds/rain.mp3')
    expect(created[0].play).toHaveBeenCalled()
  })

  it('pauses the audio on unmount', async () => {
    vi.spyOn(globalThis, 'Audio' as never).mockImplementation(() => {
      const audio = {
        loop: false,
        volume: 1,
        play: vi.fn().mockResolvedValue(undefined),
        pause: vi.fn(),
      }
      created.push({ src: '', play: audio.play, pause: audio.pause })
      return audio as never
    })

    const view = render(<WhiteNoisePlayer />)
    await userEvent.click(screen.getByRole('button', { name: /rừng/i }))
    view.unmount()

    expect(created[0].pause).toHaveBeenCalled()
  })
})
