import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { hiragana, katakana } from '../data/kana.ts'
import {
  chooseKana,
  difficulty,
  emptyMastery,
  findTarget,
  matches,
  progression,
  unlockedKana,
  updateMastery,
  xpForAnswer,
  xpToNextLevel,
  type Enemy,
} from '../game/rules.ts'
describe('Japanese content and matching', () => {
  it('has 46 unique basic hiragana and unique Hepburn readings', () => {
    assert.equal(hiragana.length, 46)
    assert.equal(new Set(hiragana.map((k) => k.character)).size, 46)
    assert.equal(new Set(hiragana.map((k) => k.romaji[0])).size, 46)
    for (const [character, reading, rejected] of [
      ['し', 'shi', 'si'],
      ['ち', 'chi', 'ti'],
      ['つ', 'tsu', 'tu'],
      ['ふ', 'fu', 'hu'],
      ['を', 'wo', 'o'],
    ]) {
      const kana = hiragana.find((k) => k.character === character)!
      assert.ok(matches(kana, ` ${reading!.toUpperCase()} `))
      assert.equal(matches(kana, rejected!), false)
    }
  })
  it('has a separate 46-character katakana set with matching readings', () => {
    assert.equal(katakana.length, 46)
    assert.equal(new Set(katakana.map((k) => k.character)).size, 46)
    assert.deepEqual(
      katakana.map((k) => k.romaji[0]),
      hiragana.map((k) => k.romaji[0]),
    )
    assert.equal(katakana.find((k) => k.character === 'シ')!.romaji[0], 'shi')
    assert.equal(katakana.find((k) => k.character === 'ツ')!.romaji[0], 'tsu')
  })
  it('targets the lowest matching falling enemy; cannot score a target twice', () => {
    const make = (id: number, y: number, state: Enemy['state'] = 'falling'): Enemy => ({
      id,
      y,
      kana: hiragana[0]!,
      x: 50,
      fallSpeed: 4,
      state,
      spawnTimestamp: id,
      effectAge: 0,
      xp: 0,
    })
    const enemies = [make(1, 20), make(2, 40), make(3, 70, 'targeted')]
    const target = findTarget(enemies, 'a')!
    assert.equal(target.id, 2)
    target.state = 'targeted'
    assert.equal(findTarget(enemies, 'a')?.id, 1)
    assert.equal(findTarget(enemies, 'shi'), undefined)
    assert.equal(findTarget([make(2, 20), make(1, 20)], 'a')?.id, 1)
  })
})
describe('progression and mastery', () => {
  it('awards capped combo XP bonuses', () => {
    assert.equal(xpForAnswer(1), 10)
    assert.equal(xpForAnswer(5), 11)
    assert.equal(xpForAnswer(100), 20)
  })
  it('handles boundaries and multiple levels without losing overflow XP', () => {
    assert.deepEqual(progression(0), { level: 1, xp: 0, required: 60 })
    assert.equal(progression(59).level, 1)
    assert.equal(progression(60).level, 2)
    assert.deepEqual(progression(60 + xpToNextLevel(2) + 7), { level: 3, xp: 7, required: xpToNextLevel(3) })
  })
  it('updates independent counters, resets streak and clamps confidence', () => {
    let m = emptyMastery()
    for (let i = 0; i < 20; i++) m = updateMastery(m, true)
    assert.equal(m.masteryScore, 1)
    m = updateMastery(m, false)
    assert.deepEqual(m, { attempts: 21, correct: 20, incorrect: 1, currentStreak: 0, masteryScore: 0.92 })
    for (let i = 0; i < 30; i++) m = updateMastery(m, false)
    assert.equal(m.masteryScore, 0)
  })
  it('does not mutate previous mastery records', () => {
    const before = emptyMastery()
    updateMastery(before, true)
    assert.deepEqual(before, emptyMastery())
  })
  it('starts gently, unlocks progressively and bounds late-game difficulty', () => {
    assert.equal(unlockedKana(1).length, 5)
    assert.equal(unlockedKana(1, 'katakana').length, 5)
    assert.equal(unlockedKana(3).length, 10)
    assert.equal(unlockedKana(19).length, 46)
    assert.equal(difficulty(1).maxEnemies, 1)
    assert.equal(difficulty(6).maxEnemies, 2)
    assert.equal(difficulty(11).maxEnemies, 3)
    assert.ok(difficulty(10).speed > difficulty(1).speed)
    assert.ok(difficulty(1000, 99999).speed <= 17)
    assert.ok(difficulty(1000).interval >= 1.4)
  })
})
describe('weighted spawning', () => {
  it('never repeats the previous character when alternatives exist', () => {
    const pool = hiragana.slice(0, 5)
    for (let i = 0; i < 100; i++)
      assert.notEqual(chooseKana(pool, {}, pool[0]!.id, () => i / 100).id, pool[0]!.id)
    assert.equal(chooseKana([pool[0]!], {}, pool[0]!.id), pool[0])
  })
  it('weights struggling characters three times as much as mastered ones', () => {
    const [a, b] = hiragana
    const mastery = { [a!.id]: { ...emptyMastery(), masteryScore: 1 } }
    let weak = 0
    for (let i = 0; i < 1000; i++)
      if (chooseKana([a!, b!], mastery, undefined, () => i / 1000).id === b!.id) weak++
    assert.equal(weak, 750)
  })
  it('rejects an empty content pool', () => assert.throws(() => chooseKana([], {})))
})
