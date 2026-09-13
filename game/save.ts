import { allKana, type KanaScript } from '../data/kana.ts'
import { progression, unlockedKana, type Mastery } from './rules.ts'
export const SAVE_KEY = 'kanafall.save.v1'
export interface Settings {
  sound: boolean
  music: boolean
  reducedMotion: boolean
  speed: number
  script: KanaScript
}
export interface Save {
  version: 2
  player: {
    totalXp: number
    level: number
    paths: Record<KanaScript, { totalXp: number; level: number }>
  }
  statistics: { correct: number; incorrect: number; bestCombo: number; bestScore: number; runs: number }
  mastery: Record<string, Mastery>
  unlocked: string[]
  settings: Settings
}
export function freshSave(): Save {
  return {
    version: 2,
    player: {
      totalXp: 0,
      level: 1,
      paths: {
        hiragana: { totalXp: 0, level: 1 },
        katakana: { totalXp: 0, level: 1 },
      },
    },
    statistics: { correct: 0, incorrect: 0, bestCombo: 0, bestScore: 0, runs: 0 },
    mastery: {},
    unlocked: [...unlockedKana(1, 'hiragana'), ...unlockedKana(1, 'katakana')].map((k) => k.id),
    settings: { sound: true, music: false, reducedMotion: false, speed: 1, script: 'hiragana' },
  }
}
const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
const count = (value: unknown, max = 1_000_000_000) =>
  typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(0, Math.floor(value))) : 0
export function parseSave(raw: string | null): Save {
  if (!raw) return freshSave()
  const source = record(JSON.parse(raw))
  // A future version must never be silently overwritten by an older client.
  if (source.version !== 1 && source.version !== 2) throw new Error('Unsupported save version')
  const save = freshSave(),
    player = record(source.player),
    stats = record(source.statistics),
    settings = record(source.settings)
  const paths = record(player.paths)
  const oldHiraganaXp = source.version === 1 ? count(player.totalXp) : 0
  for (const script of ['hiragana', 'katakana'] as const) {
    const path = record(paths[script])
    const totalXp = source.version === 1 && script === 'hiragana' ? oldHiraganaXp : count(path.totalXp)
    save.player.paths[script] = { totalXp, level: progression(totalXp).level }
  }
  save.player.totalXp = save.player.paths.hiragana.totalXp + save.player.paths.katakana.totalXp
  save.player.level = Math.max(save.player.paths.hiragana.level, save.player.paths.katakana.level)
  save.unlocked = [
    ...unlockedKana(save.player.paths.hiragana.level, 'hiragana'),
    ...unlockedKana(save.player.paths.katakana.level, 'katakana'),
  ].map((k) => k.id)
  for (const key of ['correct', 'incorrect', 'bestCombo', 'bestScore', 'runs'] as const)
    save.statistics[key] = count(stats[key])
  for (const key of ['sound', 'music', 'reducedMotion'] as const)
    if (typeof settings[key] === 'boolean') save.settings[key] = settings[key]
  if (settings.script === 'hiragana' || settings.script === 'katakana') save.settings.script = settings.script
  save.settings.speed =
    typeof settings.speed === 'number' && Number.isFinite(settings.speed)
      ? Math.min(1.5, Math.max(0.65, settings.speed))
      : 1
  const mastery = record(source.mastery)
  for (const kana of allKana) {
    if (!mastery[kana.id]) continue
    const m = record(mastery[kana.id]),
      correct = count(m.correct),
      incorrect = count(m.incorrect)
    save.mastery[kana.id] = {
      correct,
      incorrect,
      attempts: correct + incorrect,
      currentStreak: Math.min(correct, count(m.currentStreak)),
      masteryScore:
        typeof m.masteryScore === 'number' && Number.isFinite(m.masteryScore)
          ? Math.max(0, Math.min(1, m.masteryScore))
          : 0,
    }
  }
  return save
}
