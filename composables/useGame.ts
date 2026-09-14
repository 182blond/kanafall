import { ref, computed, onMounted, onUnmounted } from 'vue'
import { chooseKana, difficulty, findTarget, lessonFor, xpForAnswer, type Enemy } from '../game/rules'
import { allKana, hiragana, type Kana, type KanjiPractice } from '../data/kana'
export function useGame(
  onCorrect: (id: string, combo: number) => void = () => {},
  onWrong: (id: string) => void = () => {},
  getLevel = () => 1,
  getPool = () => hiragana.slice(0, 5),
  onImpact = () => {},
  getKanjiPractice: () => KanjiPractice = () => 'meaning',
) {
  const enemies = ref<Enemy[]>([]),
    input = ref(''),
    score = ref(0),
    combo = ref(0),
    hp = ref(5)
  const status = ref<'menu' | 'playing' | 'paused' | 'over'>('menu'),
    elapsed = ref(0),
    heroState = ref('idle'),
    feedback = ref(''),
    wrongCount = ref(0)
  const speed = ref(1),
    mastery = ref<Parameters<typeof chooseKana>[1]>({}),
    lessonIntro = ref<Kana>(),
    runBest = ref(0),
    runXp = ref(0),
    runCorrect = ref(0),
    runIncorrect = ref(0)
  let sequence = 0,
    spawnIn = 0,
    last = 0,
    frame = 0,
    heroTimer = 0,
    previousId: string | undefined
  const introducedThisRun = new Set<string>()
  const active = computed(() => enemies.value.filter((e) => e.state === 'falling'))
  function animateHero(state: string) {
    heroState.value = state
    heroTimer = 0.5
  }
  function spawnEnemy(kana: Kana) {
    const lesson = lessonFor(kana, mastery.value, getKanjiPractice())
    previousId = kana.id
    const lanes = [22, 50, 78],
      free = lanes.filter((x) => !active.value.some((e) => Math.abs(e.x - x) < 15 && e.y < 30))
    const x = free.length ? free[Math.floor(Math.random() * free.length)]! : lanes[sequence % lanes.length]!
    enemies.value.push({
      id: ++sequence,
      kana,
      x,
      y: 8,
      fallSpeed: difficulty(getLevel(), elapsed.value).speed,
      state: 'falling',
      spawnTimestamp: elapsed.value,
      effectAge: 0,
      xp: 0,
      ...lesson,
    })
  }
  function spawn(id?: string) {
    const kana =
      allKana.find((k) => k.id === id) ??
      chooseKana(getPool(), mastery.value, previousId, Math.random, getKanjiPractice())
    const unseenSkill =
      kana.type === 'kanji' && !mastery.value[`${kana.id}:${getKanjiPractice()}`]?.attempts
    if (unseenSkill && !introducedThisRun.has(kana.id)) {
      introducedThisRun.add(kana.id)
      lessonIntro.value = kana
      return
    }
    spawnEnemy(kana)
  }
  function continueLesson() {
    const kana = lessonIntro.value
    if (!kana) return
    lessonIntro.value = undefined
    spawnEnemy(kana)
    spawnIn = difficulty(getLevel(), elapsed.value).interval
  }
  function start() {
    enemies.value = []
    input.value = ''
    score.value = 0
    combo.value = 0
    hp.value = 5
    runBest.value = 0
    runXp.value = 0
    runCorrect.value = 0
    runIncorrect.value = 0
    elapsed.value = 0
    feedback.value = ''
    lessonIntro.value = undefined
    introducedThisRun.clear()
    heroState.value = 'idle'
    status.value = 'playing'
    spawnIn = 1
    spawn()
  }
  function submit() {
    if (status.value !== 'playing' || !input.value.trim() || !active.value.length) return
    const target = findTarget(enemies.value, input.value)
    if (target) {
      target.state = 'targeted'
      target.effectAge = 0
      input.value = ''
      combo.value++
      target.xp = xpForAnswer(combo.value)
      runBest.value = Math.max(runBest.value, combo.value)
      runXp.value += target.xp
      runCorrect.value++
      score.value += 100 + Math.min(combo.value, 30) * 10
      feedback.value =
        target.kana.type === 'kanji'
          ? target.prompt === 'meaning'
            ? `¡Bien! ${target.kana.kanji} significa “${target.kana.meaning}”.`
            : `¡Bien! ${target.kana.kanji} se lee ${target.kana.romaji[0]}.`
          : combo.value % 5 === 0
            ? `¡Racha de ${combo.value}!`
            : '¡Bien hecho!'
      animateHero('attack')
      onCorrect(target.masteryId, combo.value)
      spawnIn = Math.min(spawnIn, 0.45)
    } else {
      const dangerous = [...active.value].sort((a, b) => b.y - a.y)[0]!
      combo.value = 0
      wrongCount.value++
      runIncorrect.value++
      feedback.value = `Probá otra vez · ${dangerous.prompt === 'meaning' ? 'En español' : 'En romaji'}: ${dangerous.answers[0]}`
      onWrong(dangerous.masteryId)
    }
  }
  function tick(time: number) {
    const dt = Math.min((time - last) / 1000 || 0, 0.05)
    last = time
    if (status.value === 'playing' && !lessonIntro.value) {
      elapsed.value += dt
      spawnIn -= dt * speed.value
      heroTimer -= dt
      if (heroTimer <= 0) heroState.value = 'idle'
      for (const e of enemies.value) {
        if (e.state === 'falling') {
          e.y += e.fallSpeed * dt * speed.value
          if (e.y >= 83) {
            e.state = 'missed'
            e.effectAge = 0
            hp.value = Math.max(0, hp.value - 1)
            combo.value = 0
            runIncorrect.value++
            feedback.value = `${e.display} se escapó · ${e.prompt === 'meaning' ? 'Significado' : 'Lectura'}: ${e.answers[0]}`
            animateHero('hit')
            onWrong(e.masteryId)
            if (hp.value <= 0) {
              status.value = 'over'
              heroState.value = 'game-over'
              break
            }
          }
        } else {
          e.effectAge += dt
          if (e.state === 'targeted' && e.effectAge >= 0.18) {
            e.state = 'hit'
            onImpact()
          }
          if (e.effectAge >= 0.8) e.state = 'destroyed'
        }
      }
      enemies.value = enemies.value.filter((e) => e.state !== 'destroyed')
      if (
        status.value === 'playing' &&
        spawnIn <= 0 &&
        active.value.length < (getPool()[0]?.type === 'kanji' ? 1 : difficulty(getLevel()).maxEnemies)
      ) {
        spawn()
        spawnIn = difficulty(getLevel(), elapsed.value).interval
      }
    }
    frame = requestAnimationFrame(tick)
  }
  const pause = () => {
    if (status.value === 'playing') status.value = 'paused'
    else if (status.value === 'paused') status.value = 'playing'
  }
  onMounted(() => {
    frame = requestAnimationFrame(tick)
  })
  onUnmounted(() => cancelAnimationFrame(frame))
  return {
    enemies,
    input,
    score,
    combo,
    hp,
    status,
    elapsed,
    heroState,
    feedback,
    wrongCount,
    active,
    speed,
    mastery,
    lessonIntro,
    runBest,
    runXp,
    runCorrect,
    runIncorrect,
    start,
    submit,
    pause,
    spawn,
    continueLesson,
    animateHero,
  }
}
