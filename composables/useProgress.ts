import { computed, onMounted, ref } from 'vue'
import {
  freshSave,
  newestValidSave,
  parseSave,
  SAVE_BACKUP_KEY,
  SAVE_BACKUP_TIME_KEY,
  SAVE_KEY,
  SAVE_TIME_KEY,
  UnsupportedSaveVersionError,
} from '../game/save'
import { kanaFor } from '../data/kana'
import { readDurableSave, writeDurableSave } from '../game/saveStorage'
import { autoAdvanceProgress, progression, unlockedKana, updateMastery, xpForAnswer } from '../game/rules'
import { trackGameEvent } from '../game/events'
export function useProgress() {
  const save = ref(freshSave()),
    storageWarning = ref(''),
    saveMessage = ref(''),
    lastSavedAt = ref<number>(),
    ready = ref(false)
  let protectedSave = false
  let durableWrite = Promise.resolve()
  const player = computed(() => progression(save.value.player.paths[save.value.settings.script].totalXp))
  const pool = computed(() =>
    save.value.settings.randomMode
      ? kanaFor(save.value.settings.script)
      : unlockedKana(player.value.level, save.value.settings.script),
  )
  const accuracy = computed(() => {
    const s = save.value.statistics
    return s.correct + s.incorrect ? Math.round((s.correct / (s.correct + s.incorrect)) * 100) : 0
  })
  function persist() {
    if (protectedSave) return
    try {
      const raw = JSON.stringify(save.value)
      const savedAt = Date.now()
      const previous = localStorage.getItem(SAVE_KEY)
      if (previous && previous !== raw) {
        try {
          parseSave(previous)
          localStorage.setItem(SAVE_BACKUP_KEY, previous)
          localStorage.setItem(
            SAVE_BACKUP_TIME_KEY,
            localStorage.getItem(SAVE_TIME_KEY) ?? String(savedAt - 1),
          )
        } catch {
          // Never replace a valid backup with a broken primary save.
        }
      }
      localStorage.setItem(SAVE_KEY, raw)
      localStorage.setItem(SAVE_TIME_KEY, String(savedAt))
      lastSavedAt.value = savedAt
      storageWarning.value = ''
      durableWrite = durableWrite
        .then(() => writeDurableSave({ raw, savedAt }))
        .catch(() => undefined)
    } catch {
      storageWarning.value =
        'No se pudo guardar en este navegador. Tu progreso seguirá disponible durante esta sesión.'
    }
  }
  function syncProgress() {
    save.value.player.totalXp = Object.values(save.value.player.paths).reduce(
      (sum, current) => sum + current.totalXp,
      0,
    )
    save.value.player.level = Math.max(...Object.values(save.value.player.paths).map((current) => current.level))
    save.value.unlocked = [
      ...unlockedKana(save.value.player.paths.hiragana.level, 'hiragana'),
      ...unlockedKana(save.value.player.paths.katakana.level, 'katakana'),
      ...unlockedKana(save.value.player.paths.kanji.level, 'kanji'),
    ].map((k) => k.id)
  }
  function addXp(amount: number) {
    const previous = player.value.level
    const path = save.value.player.paths[save.value.settings.script]
    path.totalXp += amount
    path.level = progression(path.totalXp).level
    syncProgress()
    if (player.value.level > previous) trackGameEvent('level_up', { level: player.value.level })
    persist()
  }
  function autoAdvanceIfMastered() {
    if (save.value.settings.randomMode) return
    const path = save.value.player.paths[save.value.settings.script]
    const next = autoAdvanceProgress(
      path.level,
      path.totalXp,
      save.value.settings.script,
      save.value.mastery,
      save.value.settings.kanjiPractice,
    )
    if (next.advanced) {
      path.totalXp = next.totalXp
      path.level = next.level
      syncProgress()
      persist()
    }
  }
  function answer(id: string, correct: boolean, combo = 0, awardedXp?: number) {
    const itemStreak = (save.value.mastery[id]?.currentStreak ?? 0) + 1
    save.value.mastery[id] = updateMastery(save.value.mastery[id], correct)
    if (correct) {
      save.value.statistics.correct++
      save.value.statistics.bestCombo = Math.max(save.value.statistics.bestCombo, combo)
      addXp(awardedXp ?? xpForAnswer(combo, itemStreak))
      autoAdvanceIfMastered()
    } else {
      save.value.statistics.incorrect++
      persist()
    }
    trackGameEvent(correct ? 'answer_correct' : 'answer_wrong', { item: id, combo })
  }
  function reset() {
    protectedSave = false
    localStorage.removeItem(SAVE_KEY)
    localStorage.removeItem(SAVE_TIME_KEY)
    localStorage.removeItem(SAVE_BACKUP_KEY)
    localStorage.removeItem(SAVE_BACKUP_TIME_KEY)
    save.value = freshSave()
    saveMessage.value = 'El progreso se restableció.'
    persist()
  }
  function downloadBackup() {
    const blob = new Blob([JSON.stringify(save.value, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `kanafall-respaldo-${new Date().toISOString().slice(0, 10)}.json`
    document.body.append(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    saveMessage.value = 'Respaldo descargado.'
  }
  function importBackup(raw: string) {
    try {
      const imported = parseSave(raw)
      protectedSave = false
      save.value = imported
      saveMessage.value = 'Respaldo restaurado correctamente.'
      persist()
      return true
    } catch {
      saveMessage.value = 'Ese archivo no es un respaldo válido de Kanafall.'
      return false
    }
  }
  onMounted(async () => {
    try {
      const primaryRaw = localStorage.getItem(SAVE_KEY)
      if (primaryRaw) {
        try {
          parseSave(primaryRaw)
        } catch (error) {
          if (error instanceof UnsupportedSaveVersionError) {
            protectedSave = true
            storageWarning.value =
              'Este guardado pertenece a una versión más nueva. Lo conservamos sin sobrescribirlo.'
            ready.value = true
            return
          }
        }
      }
      const durable = await readDurableSave().catch(() => undefined)
      const recovered = newestValidSave([
        {
          raw: primaryRaw,
          savedAt: Number(localStorage.getItem(SAVE_TIME_KEY)) || 1,
          source: 'primary',
        },
        {
          raw: localStorage.getItem(SAVE_BACKUP_KEY),
          savedAt: Number(localStorage.getItem(SAVE_BACKUP_TIME_KEY)) || 0,
          source: 'backup',
        },
        { raw: durable?.raw ?? null, savedAt: durable?.savedAt ?? 0, source: 'durable' },
      ])
      save.value = recovered?.save ?? freshSave()
      lastSavedAt.value = recovered?.savedAt || undefined
      if (recovered && recovered.source !== 'primary') {
        saveMessage.value =
          recovered.source === 'durable'
            ? 'Recuperamos tu progreso desde la copia duradera.'
            : 'Recuperamos tu progreso desde la copia anterior.'
        persist()
      }
      if (!recovered)
        save.value.settings.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    } catch {
      protectedSave = true
      storageWarning.value =
        'No pudimos leer el guardado. Jugás sin sobrescribirlo; podés restablecerlo desde Ajustes.'
    }
    ready.value = true
  })
  return {
    save,
    player,
    pool,
    accuracy,
    ready,
    storageWarning,
    saveMessage,
    lastSavedAt,
    persist,
    answer,
    addXp,
    reset,
    downloadBackup,
    importBackup,
  }
}
