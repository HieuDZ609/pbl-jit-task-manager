import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WhiteNoisePlayer, NOISE_SOUNDS, type PlayableAudio } from '../white-noise'

function fakeAudioFactory() {
  const created: PlayableAudio[] = []
  const factory = (src: string) => {
    const audio: PlayableAudio = {
      loop: false,
      volume: 1,
      play: vi.fn().mockResolvedValue(undefined),
      pause: vi.fn(),
    }
    Object.defineProperty(audio, 'src', { value: src })
    created.push(audio)
    return audio
  }
  return { factory, created }
}

describe('WhiteNoisePlayer', () => {
  it('renders all 4 sound options', () => {
    const { factory } = fakeAudioFactory()
    render(<WhiteNoisePlayer createAudio={factory} />)
    for (const s of NOISE_SOUNDS) {
      expect(screen.getByRole('button', { name: new RegExp(s.label, 'i') })).toBeInTheDocument()
    }
  })

  it('starts off', () => {
    const { factory } = fakeAudioFactory()
    render(<WhiteNoisePlayer createAudio={factory} />)
    expect(screen.getByTestId('noise-state')).toHaveTextContent(/Tắt/)
  })

  it('toggles playing on click', async () => {
    const { factory, created } = fakeAudioFactory()
    render(<WhiteNoisePlayer createAudio={factory} />)
    await userEvent.click(screen.getByRole('button', { name: /mưa/i }))
    expect(screen.getByTestId('noise-state')).toHaveTextContent(/Đang phát/i)
    expect(created[0].play).toHaveBeenCalled()
  })

  it('stops and pauses when clicking the active sound again', async () => {
    const { factory, created } = fakeAudioFactory()
    render(<WhiteNoisePlayer createAudio={factory} />)
    const btn = screen.getByRole('button', { name: /mưa/i })
    await userEvent.click(btn)
    await userEvent.click(btn)
    expect(created[0].pause).toHaveBeenCalled()
    expect(screen.getByTestId('noise-state')).toHaveTextContent(/Tắt/)
  })

  it('calls onSoundChange with the selected sound', async () => {
    const { factory } = fakeAudioFactory()
    const onChange = vi.fn()
    render(<WhiteNoisePlayer onSoundChange={onChange} createAudio={factory} />)
    await userEvent.click(screen.getByRole('button', { name: /rừng/i }))
    expect(onChange).toHaveBeenCalledWith('forest')
  })

  it('pauses the previous sound when switching', async () => {
    const { factory, created } = fakeAudioFactory()
    render(<WhiteNoisePlayer createAudio={factory} />)
    await userEvent.click(screen.getByRole('button', { name: /mưa/i }))
    await userEvent.click(screen.getByRole('button', { name: /rừng/i }))
    expect(created[0].pause).toHaveBeenCalled()
  })

  it('sets loop and volume on the created audio', async () => {
    const { factory, created } = fakeAudioFactory()
    render(<WhiteNoisePlayer createAudio={factory} />)
    await userEvent.click(screen.getByRole('button', { name: /sóng biển/i }))
    expect(created[0].loop).toBe(true)
    expect(created[0].volume).toBeCloseTo(0.4)
  })

  it('exposes a volume slider and applies it to the audio', async () => {
    const { factory, created } = fakeAudioFactory()
    render(<WhiteNoisePlayer createAudio={factory} />)
    await userEvent.click(screen.getByRole('button', { name: /mưa/i }))
    const slider = screen.getByLabelText(/Âm lượng/i)
    expect(slider).toBeInTheDocument()
    fireEvent.change(slider, { target: { value: '0.9' } })
    expect(created[0].volume).toBeCloseTo(0.9)
  })
})
