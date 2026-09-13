import { ref, computed, onMounted, onUnmounted } from 'vue'
import { chooseKana, difficulty, findTarget, xpForAnswer, type Enemy } from '../game/rules'
import { allKana, hiragana } from '../data/kana'
export function useGame(
  onCorrect: (id: string, combo: number) => void = () => {},
  onWrong: (id: string) => void = () => {},
  getLevel = () => 1,
  getPool = () => hiragana.slice(0, 5),
  onImpact = () => {},
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
  const active = computed(() => enemies.value.filter((e) => e.state === 'falling'))
  function animateHero(state: string) {
    heroState.value = state
    heroTimer = 0.5
  }
  function spawn(id?: string) {
    const kana = allKana.find((k) => k.id === id) ?? chooseKana(getPool(), mastery.value, previousId)
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
    })
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
      feedback.value = combo.value % 5 === 0 ? `¡Racha de ${combo.value}!` : '¡Bien hecho!'
      animateHero('attack')
      onCorrect(target.kana.id, combo.value)
      spawnIn = Math.min(spawnIn, 0.45)
    } else {
      const dangerous = [...active.value].sort((a, b) => b.y - a.y)[0]!
      combo.value = 0
      wrongCount.value++
      runIncorrect.value++
      feedback.value = `Probá de nuevo · ${dangerous.kana.character} = ${dangerous.kana.romaji[0]}`
      onWrong(dangerous.kana.id)
    }
  }
  function tick(time: number) {
    const dt = Math.min((time - last) / 1000 || 0, 0.05)
    last = time
    if (status.value === 'playing') {
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
            feedback.value = `${e.kana.character} se escapó · ${e.kana.romaji[0]}`
            animateHero('hit')
            onWrong(e.kana.id)
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
        active.value.length < difficulty(getLevel()).maxEnemies
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
    runBest,
    runXp,
    runCorrect,
    runIncorrect,
    start,
    submit,
    pause,
    spawn,
    animateHero,
  }
}
