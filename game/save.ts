import { allKana, masteryKeysFor, type KanjiPractice, type KanaScript, type PracticeScript } from '../data/kana.ts'
import { progression, unlockedKana, type Mastery } from './rules.ts'
export const SAVE_KEY = 'kanafall.save.v1'
export const SAVE_BACKUP_KEY = 'kanafall.save.backup.v1'
export const SAVE_TIME_KEY = 'kanafall.save.time.v1'
export const SAVE_BACKUP_TIME_KEY = 'kanafall.save.backup-time.v1'
export class UnsupportedSaveVersionError extends Error {}
export interface Settings {
  sound: boolean
  music: boolean
  reducedMotion: boolean
  speed: number
  script: PracticeScript
  kanjiPractice: KanjiPractice
}
export interface Save {
  version: 3
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
    version: 3,
    player: {
      totalXp: 0,
      level: 1,
      paths: {
        hiragana: { totalXp: 0, level: 1 },
        katakana: { totalXp: 0, level: 1 },
        kanji: { totalXp: 0, level: 1 },
      },
    },
    statistics: { correct: 0, incorrect: 0, bestCombo: 0, bestScore: 0, runs: 0 },
    mastery: {},
    unlocked: [
      ...unlockedKana(1, 'hiragana'),
      ...unlockedKana(1, 'katakana'),
      ...unlockedKana(1, 'kanji'),
    ].map((k) => k.id),
    settings: {
      sound: true,
      music: false,
      reducedMotion: false,
      speed: 1,
      script: 'hiragana',
      kanjiPractice: 'meaning',
    },
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
  if (source.version !== 1 && source.version !== 2 && source.version !== 3)
    throw new UnsupportedSaveVersionError('Unsupported save version')
  const save = freshSave(),
    player = record(source.player),
    stats = record(source.statistics),
    settings = record(source.settings)
  const paths = record(player.paths)
  const oldHiraganaXp = source.version === 1 ? count(player.totalXp) : 0
  for (const script of ['hiragana', 'katakana', 'kanji'] as const) {
    const path = record(paths[script])
    const totalXp = source.version === 1 && script === 'hiragana' ? oldHiraganaXp : count(path.totalXp)
    save.player.paths[script] = { totalXp, level: progression(totalXp).level }
  }
  save.player.totalXp = Object.values(save.player.paths).reduce((sum, path) => sum + path.totalXp, 0)
  save.player.level = Math.max(...Object.values(save.player.paths).map((path) => path.level))
  save.unlocked = [
    ...unlockedKana(save.player.paths.hiragana.level, 'hiragana'),
    ...unlockedKana(save.player.paths.katakana.level, 'katakana'),
    ...unlockedKana(save.player.paths.kanji.level, 'kanji'),
  ].map((k) => k.id)
  for (const key of ['correct', 'incorrect', 'bestCombo', 'bestScore', 'runs'] as const)
    save.statistics[key] = count(stats[key])
  for (const key of ['sound', 'music', 'reducedMotion'] as const)
    if (typeof settings[key] === 'boolean') save.settings[key] = settings[key]
  if (settings.script === 'hiragana' || settings.script === 'katakana' || settings.script === 'kanji' || settings.script === 'random')
    save.settings.script = settings.script
  if (settings.kanjiPractice === 'meaning' || settings.kanjiPractice === 'reading')
    save.settings.kanjiPractice = settings.kanjiPractice
  save.settings.speed =
    typeof settings.speed === 'number' && Number.isFinite(settings.speed)
      ? Math.min(1.5, Math.max(0.65, settings.speed))
      : 1
  const mastery = record(source.mastery)
  for (const key of allKana.flatMap(masteryKeysFor)) {
    if (!mastery[key]) continue
    const m = record(mastery[key]),
      correct = count(m.correct),
      incorrect = count(m.incorrect)
    save.mastery[key] = {
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

export interface SaveCandidate {
  raw: string | null
  savedAt: number
  source: 'primary' | 'backup' | 'durable'
}

export function newestValidSave(candidates: readonly SaveCandidate[]) {
  return candidates
    .flatMap((candidate) => {
      if (!candidate.raw) return []
      try {
        return [{ ...candidate, save: parseSave(candidate.raw) }]
      } catch {
        return []
      }
    })
    .sort((a, b) => b.savedAt - a.savedAt)[0]
}
