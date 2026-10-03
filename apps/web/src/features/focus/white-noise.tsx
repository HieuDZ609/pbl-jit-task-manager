'use client'

import { useEffect, useRef, useState } from 'react'

export const NOISE_SOUNDS = [
  { id: 'rain', label: 'Tiếng mưa', src: '/sounds/rain.mp3' },
  { id: 'cafe', label: 'Quán cà phê', src: '/sounds/cafe.mp3' },
  { id: 'forest', label: 'Rừng cây', src: '/sounds/forest.mp3' },
  { id: 'ocean', label: 'Sóng biển', src: '/sounds/ocean.mp3' },
] as const

export type NoiseSoundId = (typeof NOISE_SOUNDS)[number]['id']

/** Minimal audio surface the player needs — lets tests inject a fake. */
export type PlayableAudio = {
  loop: boolean
  volume: number
  play: () => Promise<void> | void
  pause: () => void
}

export type AudioFactory = (src: string) => PlayableAudio

const defaultFactory: AudioFactory = (src) => new Audio(src)

type Props = {
  onSoundChange?: (id: NoiseSoundId) => void
  createAudio?: AudioFactory
}

export function WhiteNoisePlayer({ onSoundChange, createAudio = defaultFactory }: Props) {
  const [active, setActive] = useState<NoiseSoundId | null>(null)
  const [volume, setVolume] = useState(0.4)
  const audioRef = useRef<PlayableAudio | null>(null)

  useEffect(() => {
    return () => {
      audioRef.current?.pause()
      audioRef.current = null
    }
  }, [])

  function stop() {
    audioRef.current?.pause()
    audioRef.current = null
  }

  function toggle(sound: (typeof NOISE_SOUNDS)[number]) {
    if (active === sound.id) {
      stop()
      setActive(null)
      return
    }
    stop()
    const audio = createAudio(sound.src)
    audio.loop = true
    audio.volume = volume
    void Promise.resolve(audio.play()).catch(() => {
      // Autoplay bị chặn — bỏ qua, state vẫn phản ánh lựa chọn
    })
    audioRef.current = audio
    setActive(sound.id)
    onSoundChange?.(sound.id)
  }

  function handleVolume(value: number) {
    setVolume(value)
    if (audioRef.current) audioRef.current.volume = value
  }

  return (
    <div className="space-y-2 rounded-lg border p-4">
      <p data-testid="noise-state" className="text-sm text-muted-foreground">
        {active ? `Đang phát: ${NOISE_SOUNDS.find((s) => s.id === active)?.label}` : 'Âm thanh nền: Tắt'}
      </p>
      <div className="flex flex-wrap gap-2">
        {NOISE_SOUNDS.map((sound) => (
          <button
            key={sound.id}
            type="button"
            onClick={() => toggle(sound)}
            aria-pressed={active === sound.id}
            className={[
              'rounded border px-3 py-1 text-sm',
              active === sound.id ? 'bg-slate-900 text-white' : '',
            ].join(' ')}
          >
            {sound.label}
          </button>
        ))}
      </div>
      <label className="flex items-center gap-2 text-sm">
        <span>Âm lượng</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          onChange={(e) => handleVolume(Number(e.target.value))}
        />
      </label>
    </div>
  )
}
