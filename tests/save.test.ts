import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { freshSave, newestValidSave, parseSave } from '../game/save.ts'
describe('versioned save boundary', () => {
  it('returns a fresh save and round-trips valid progress', () => {
    assert.deepEqual(parseSave(null), freshSave())
    const save = freshSave()
    save.player.paths.hiragana = { level: 2, totalXp: 60 }
    save.player = { ...save.player, level: 2, totalXp: 60 }
    save.statistics.correct = 6
    assert.deepEqual(parseSave(JSON.stringify(save)), save)
  })
  it('reconstructs level and unlocks instead of trusting inconsistent stored fields', () => {
    const save = freshSave()
    save.player.paths.hiragana = { level: 999, totalXp: 220 }
    save.player = { ...save.player, level: 999, totalXp: 220 }
    save.unlocked = []
    const parsed = parseSave(JSON.stringify(save))
    assert.equal(parsed.player.level, 3)
    assert.equal(parsed.unlocked.length, 20)
  })
  it('rejects malformed JSON and unknown versions so their contents can be protected', () => {
    assert.throws(() => parseSave('{'))
    assert.throws(() => parseSave('{"version":4}'))
  })
  it('sanitizes invalid counters, settings, and mastery', () => {
    const parsed = parseSave(
      JSON.stringify({
        version: 1,
        player: { totalXp: -20 },
        settings: { speed: 500, sound: 'yes' },
        statistics: { correct: -1 },
        mastery: {
          'hiragana-a': { correct: 3, incorrect: 2, attempts: 999, currentStreak: 99, masteryScore: 7 },
          arbitrary: {},
        },
      }),
    )
    assert.equal(parsed.player.totalXp, 0)
    assert.equal(parsed.settings.speed, 1.5)
    assert.equal(parsed.settings.sound, true)
    assert.deepEqual(parsed.mastery['hiragana-a'], {
      correct: 3,
      incorrect: 2,
      attempts: 5,
      currentStreak: 3,
      masteryScore: 1,
    })
    assert.equal(parsed.mastery.arbitrary, undefined)
  })
  it('migrates a v1 hiragana save and starts katakana separately', () => {
    const parsed = parseSave(
      JSON.stringify({ version: 1, player: { totalXp: 220 }, settings: {}, statistics: {} }),
    )
    assert.deepEqual(parsed.player.paths.hiragana, { totalXp: 220, level: 3 })
    assert.deepEqual(parsed.player.paths.katakana, { totalXp: 0, level: 1 })
    assert.deepEqual(parsed.player.paths.kanji, { totalXp: 0, level: 1 })
    assert.equal(parsed.version, 3)
  })
  it('migrates a v2 kana save and keeps the new kanji path separate', () => {
    const parsed = parseSave(
      JSON.stringify({
        version: 2,
        player: { paths: { hiragana: { totalXp: 60 }, katakana: { totalXp: 120 } } },
        settings: { script: 'katakana' },
      }),
    )
    assert.equal(parsed.player.paths.hiragana.totalXp, 60)
    assert.equal(parsed.player.paths.katakana.totalXp, 120)
    assert.deepEqual(parsed.player.paths.kanji, { totalXp: 0, level: 1 })
    assert.equal(parsed.settings.script, 'katakana')
  })
  it('recovers the newest valid redundant save when the primary copy is broken', () => {
    const backup = freshSave()
    backup.player.paths.kanji.totalXp = 120
    const durable = freshSave()
    durable.player.paths.kanji.totalXp = 220
    const recovered = newestValidSave([
      { raw: '{broken', savedAt: 300, source: 'primary' },
      { raw: JSON.stringify(backup), savedAt: 100, source: 'backup' },
      { raw: JSON.stringify(durable), savedAt: 200, source: 'durable' },
    ])
    assert.equal(recovered?.source, 'durable')
    assert.equal(recovered?.save.player.paths.kanji.totalXp, 220)
  })
})
