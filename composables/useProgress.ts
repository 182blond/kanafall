import { computed, onMounted, ref } from 'vue'
import { freshSave, parseSave, SAVE_KEY } from '../game/save'
import { progression, unlockedKana, updateMastery, xpForAnswer } from '../game/rules'
import { trackGameEvent } from '../game/events'
export function useProgress() {
  const save = ref(freshSave()),
    storageWarning = ref(''),
    ready = ref(false)
  let protectedSave = false
  const player = computed(() => progression(save.value.player.paths[save.value.settings.script].totalXp))
  const pool = computed(() => unlockedKana(player.value.level, save.value.settings.script))
  const accuracy = computed(() => {
    const s = save.value.statistics
    return s.correct + s.incorrect ? Math.round((s.correct / (s.correct + s.incorrect)) * 100) : 0
  })
  function persist() {
    if (protectedSave) return
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(save.value))
      storageWarning.value = ''
    } catch {
      storageWarning.value =
        'No se pudo guardar en este navegador. Tu progreso seguirá disponible durante esta sesión.'
    }
  }
  function addXp(amount: number) {
    const previous = player.value.level
    const path = save.value.player.paths[save.value.settings.script]
    path.totalXp += amount
    path.level = player.value.level
    save.value.player.totalXp =
      save.value.player.paths.hiragana.totalXp + save.value.player.paths.katakana.totalXp
    save.value.player.level = Math.max(
      save.value.player.paths.hiragana.level,
      save.value.player.paths.katakana.level,
    )
    save.value.unlocked = [
      ...unlockedKana(save.value.player.paths.hiragana.level, 'hiragana'),
      ...unlockedKana(save.value.player.paths.katakana.level, 'katakana'),
    ].map((k) => k.id)
    if (player.value.level > previous) trackGameEvent('level_up', { level: player.value.level })
    persist()
  }
  function answer(id: string, correct: boolean, combo = 0) {
    save.value.mastery[id] = updateMastery(save.value.mastery[id], correct)
    if (correct) {
      save.value.statistics.correct++
      save.value.statistics.bestCombo = Math.max(save.value.statistics.bestCombo, combo)
      addXp(xpForAnswer(combo))
    } else {
      save.value.statistics.incorrect++
      persist()
    }
    trackGameEvent(correct ? 'answer_correct' : 'answer_wrong', { kana: id, combo })
  }
  function reset() {
    protectedSave = false
    save.value = freshSave()
    persist()
  }
  onMounted(() => {
    try {
      const raw = localStorage.getItem(SAVE_KEY)
      save.value = parseSave(raw)
      if (!raw)
        save.value.settings.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    } catch {
      protectedSave = true
      storageWarning.value =
        'No pudimos leer el guardado. Jugás sin sobrescribirlo; podés restablecerlo desde Ajustes.'
    }
    ready.value = true
  })
  return { save, player, pool, accuracy, ready, storageWarning, persist, answer, addXp, reset }
}
