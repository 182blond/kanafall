import { kanaFor, type Kana, type KanjiPractice, type KanaScript, type PracticeScript } from '../data/kana.ts'
export interface Mastery {
  attempts: number
  correct: number
  incorrect: number
  currentStreak: number
  masteryScore: number
}
export interface Enemy {
  id: number
  kana: Kana
  x: number
  y: number
  fallSpeed: number
  state: 'falling' | 'targeted' | 'hit' | 'destroyed' | 'missed'
  spawnTimestamp: number
  effectAge: number
  xp: number
  display: string
  hint?: string
  readingAid?: string
  answers: readonly string[]
  masteryId: string
  prompt: 'reading' | 'meaning'
}
export const emptyMastery = (): Mastery => ({
  attempts: 0,
  correct: 0,
  incorrect: 0,
  currentStreak: 0,
  masteryScore: 0,
})
export const normalize = (value: string) =>
  value.trim().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
export const matches = (target: Kana | Enemy, answer: string) => {
  const choices = 'answers' in target ? target.answers : target.romaji
  return choices.map(normalize).includes(normalize(answer))
}
export const xpForAnswer = (combo: number, itemStreak = 1) =>
  10 + Math.min(10, Math.floor(combo / 5)) + Math.min(8, Math.max(0, itemStreak - 1) * 2)
export const xpToNextLevel = (level: number) => Math.round(60 * Math.max(1, level) ** 1.4)
export function progression(totalXp: number) {
  let level = 1,
    xp = Math.max(0, totalXp)
  while (xp >= xpToNextLevel(level)) {
    xp -= xpToNextLevel(level)
    level++
  }
  return { level, xp, required: xpToNextLevel(level) }
}
export function updateMastery(previous: Mastery | undefined, correct: boolean): Mastery {
  const m = previous ?? emptyMastery()
  return {
    attempts: m.attempts + 1,
    correct: m.correct + Number(correct),
    incorrect: m.incorrect + Number(!correct),
    currentStreak: correct ? m.currentStreak + 1 : 0,
    masteryScore: Math.min(1, Math.max(0, m.masteryScore + (correct ? 0.12 : -0.08))),
  }
}
export function difficulty(level: number, seconds = 0) {
  const pressure = Math.min(3, seconds / 150)
  return {
    speed: Math.min(17, 3.8 + (level - 1) * 0.48 + pressure),
    interval: Math.max(1.4, 3.6 - level * 0.12 - pressure * 0.15),
    maxEnemies: level < 6 ? 1 : level < 11 ? 2 : 3,
    groups: Math.min(10, Math.ceil(level / 2)),
  }
}
export const unlockedKana = (level: number, script: PracticeScript = 'hiragana') =>
  script === 'random' ? kanaFor(script) : kanaFor(script).filter((k) => k.group < difficulty(level).groups)
export function autoAdvanceProgress(
  level: number,
  totalXp: number,
  script: KanaScript,
  mastery: Record<string, Mastery>,
  kanjiPractice: KanjiPractice = 'meaning',
) {
  let nextLevel = level,
    nextTotalXp = totalXp,
    advanced = false
  while (unlockedKana(nextLevel, script).length < kanaFor(script).length) {
    const pending = unlockedKana(nextLevel, script)
    if (
      !pending.length ||
      !pending.every((item) => {
        const key = item.type === 'kanji' ? `${item.id}:${kanjiPractice}` : item.id
        return (mastery[key]?.masteryScore ?? 0) >= 1
      })
    )
      break
    const current = progression(nextTotalXp)
    nextTotalXp += Math.max(0, current.required - current.xp)
    nextLevel = progression(nextTotalXp).level
    advanced = true
  }
  return { level: nextLevel, totalXp: nextTotalXp, advanced }
}
export function lessonFor(
  kana: Kana,
  mastery: Record<string, Mastery>,
  kanjiPractice: KanjiPractice = 'meaning',
) {
  if (kana.type !== 'kanji')
    return { display: kana.character, answers: kana.romaji, masteryId: kana.id, prompt: 'reading' as const }
  const meaningId = `${kana.id}:meaning`,
    readingId = `${kana.id}:reading`,
    reading = mastery[readingId]
  if (kanjiPractice === 'meaning') {
    return {
      display: kana.kanji!,
      hint: '¿Qué significa esta palabra?',
      readingAid: kana.reading,
      answers: kana.meaningAnswers ?? [kana.meaning!],
      masteryId: meaningId,
      prompt: 'meaning' as const,
    }
  }
  return {
    display: kana.kanji!,
    hint: !reading || reading.attempts < 2 ? kana.reading : undefined,
    answers: kana.romaji,
    masteryId: readingId,
    prompt: 'reading' as const,
  }
}
export function chooseKana(
  pool: Kana[],
  mastery: Record<string, Mastery>,
  previousId?: string,
  random = Math.random,
  kanjiPractice: KanjiPractice = 'meaning',
  randomMode = false,
): Kana {
  const choices = pool.filter((k) => pool.length === 1 || k.id !== previousId)
  if (!choices.length) throw new Error('The character pool must not be empty')
  const weights = choices.map((k) => {
    if (randomMode) return 1
    const score =
      k.type === 'kanji'
        ? mastery[`${k.id}:${kanjiPractice}`]?.masteryScore ?? 0
        : mastery[k.id]?.masteryScore ?? 0
    // A fully mastered item stays in the pool for spaced review, but should
    // yield its place to anything still being learned. This keeps review
    // alive without trapping the player in the same familiar characters.
    return score >= 1 ? 0.08 : 1 + (1 - score) * 2
  })
  let cursor = Math.min(0.999999, Math.max(0, random())) * weights.reduce((a, b) => a + b, 0)
  return choices.find((_, i) => (cursor -= weights[i]!) < 0) ?? choices[choices.length - 1]!
}
export function findTarget(enemies: Enemy[], answer: string): Enemy | undefined {
  return enemies
    .filter((e) => e.state === 'falling' && matches(e, answer))
    .sort((a, b) => b.y - a.y || a.spawnTimestamp - b.spawnTimestamp || a.id - b.id)[0]
}
export const masteryLabel = (score: number) =>
  score >= 0.85 ? 'Dominado' : score >= 0.6 ? 'Familiar' : score >= 0.25 ? 'Aprendiendo' : 'Nuevo'
