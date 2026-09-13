import { onUnmounted } from 'vue'
import type { Settings } from '../game/save'
type Sound = 'correct' | 'attack' | 'impact' | 'wrong' | 'level' | 'over'
export function useAudio(settings: () => Settings) {
  let context: AudioContext | undefined,
    musicTimer: ReturnType<typeof setInterval> | undefined,
    note = 0
  function unlock() {
    try {
      context ??= new AudioContext()
      if (context.state === 'suspended') void context.resume().catch(() => {})
    } catch {
      /* Audio is optional. */
    }
  }
  function tone(
    frequency: number,
    delay: number,
    duration: number,
    volume = 0.035,
    type: OscillatorType = 'sine',
  ) {
    if (!context || context.state !== 'running') return
    const oscillator = context.createOscillator(),
      gain = context.createGain(),
      start = context.currentTime + delay
    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, start)
    gain.gain.setValueAtTime(0, start)
    gain.gain.linearRampToValueAtTime(volume, start + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start(start)
    oscillator.stop(start + duration + 0.02)
    oscillator.onended = () => {
      oscillator.disconnect()
      gain.disconnect()
    }
  }
  function play(sound: Sound) {
    if (!settings().sound) return
    if (sound === 'correct') {
      tone(660, 0, 0.12)
      tone(880, 0.05, 0.18)
    }
    if (sound === 'attack') tone(320, 0.025, 0.09, 0.018, 'triangle')
    if (sound === 'impact') tone(1100, 0, 0.16, 0.028)
    if (sound === 'wrong') tone(165, 0, 0.17, 0.018, 'triangle')
    if (sound === 'level') [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.4))
    if (sound === 'over') [392, 330, 262].forEach((f, i) => tone(f, i * 0.16, 0.5, 0.025))
  }
  function stopMusic() {
    if (musicTimer) clearInterval(musicTimer)
    musicTimer = undefined
  }
  function syncMusic(playing: boolean) {
    stopMusic()
    if (!playing || !settings().music) return
    const phrase = [262, 330, 392, 494, 440, 392, 330, 294]
    musicTimer = setInterval(() => {
      tone(phrase[note++ % phrase.length]!, 0, 1.6, 0.009)
      tone(131, 0, 1.9, 0.005)
    }, 800)
  }
  onUnmounted(() => {
    stopMusic()
    void context?.close()
  })
  return { unlock, play, syncMusic }
}
