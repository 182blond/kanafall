<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useGame } from './composables/useGame'
import { useProgress } from './composables/useProgress'
import { useAudio } from './composables/useAudio'
import { allKana, groupsFor, scriptJapanese, type KanaScript } from './data/kana'
import { xpToNextLevel } from './game/rules'
import { trackGameEvent } from './game/events'
import type { Settings } from './game/save'
import Spirit from './components/Spirit.vue'
import GameArena from './components/GameArena.vue'
import ProgressScreen from './components/ProgressScreen.vue'
import SettingsScreen from './components/SettingsScreen.vue'
const progress = useProgress()
const { save, player, pool, accuracy, ready, storageWarning, saveMessage, lastSavedAt } = progress
const audio = useAudio(() => save.value.settings)
const game = useGame(
  (id, combo, xp) => {
    progress.answer(id, true, combo, xp)
    audio.play('correct')
    audio.play('attack')
  },
  (id) => {
    progress.answer(id, false)
    audio.play('wrong')
  },
  () => player.value.level,
  () => pool.value,
  () => audio.play('impact'),
  () => save.value.settings.kanjiPractice,
)
const { status, score, runBest, runXp, runCorrect, runIncorrect } = game
const page = ref<'game' | 'progress' | 'settings'>('game'),
  resetRequested = ref(false),
  levelNotice = ref(''),
  debugOpen = ref(false),
  debugKana = ref(allKana[0]!.id)
const arena = ref<InstanceType<typeof GameArena>>()
const isDev = import.meta.dev
let noticeTimer: ReturnType<typeof setTimeout> | undefined
const syncVisibleViewport = () => {
  const viewport = window.visualViewport
  document.documentElement.style.setProperty('--visible-height', `${viewport?.height ?? window.innerHeight}px`)
}
const groups = computed(() => groupsFor(save.value.settings.script))
const currentGroup = computed(() =>
  groups.value[Math.min(groups.value.length - 1, Math.ceil(player.value.level / 2) - 1)]!,
)
const nextGroup = computed(() => groups.value[Math.ceil(player.value.level / 2)])
const runAccuracy = computed(() =>
  runCorrect.value + runIncorrect.value
    ? Math.round((runCorrect.value / (runCorrect.value + runIncorrect.value)) * 100)
    : 0,
)
watch(
  () => save.value.settings,
  (s) => {
    game.speed.value = s.speed
    audio.syncMusic(status.value === 'playing')
    progress.persist()
  },
  { deep: true },
)
watch(
  () => save.value.mastery,
  (m) => {
    game.mastery.value = m
  },
  { deep: true, immediate: true },
)
watch(
  () => player.value.level,
  (level, before) => {
    if (!ready.value || level <= before || status.value !== 'playing') return
    levelNotice.value =
      Math.ceil(level / 2) > Math.ceil(before / 2)
        ? `¡Nuevas letras: ${currentGroup.value[1]}!`
        : 'Nilo crece con vos.'
    game.animateHero('level-up')
    audio.play('level')
    if (noticeTimer) clearTimeout(noticeTimer)
    noticeTimer = setTimeout(() => {
      levelNotice.value = ''
    }, 2400)
  },
)
watch(status, async (value, before) => {
  audio.syncMusic(value === 'playing')
  if (value === 'over') {
    audio.play('over')
    trackGameEvent('game_over', { score: score.value, combo: runBest.value })
  }
  if ((value === 'over' || value === 'menu') && before !== 'menu') {
    save.value.statistics.bestScore = Math.max(save.value.statistics.bestScore, score.value)
    progress.persist()
  }
  if (value === 'paused' || value === 'over') {
    await nextTick()
    document.querySelector<HTMLButtonElement>('.overlay .primary')?.focus()
  }
})
watch(score, (value) => {
  if (value > save.value.statistics.bestScore) {
    save.value.statistics.bestScore = value
    progress.persist()
  }
})
async function start() {
  audio.unlock()
  levelNotice.value = ''
  page.value = 'game'
  save.value.statistics.runs++
  progress.persist()
  game.start()
  trackGameEvent('game_start', { level: player.value.level })
  await nextTick()
  arena.value?.focus()
}
async function resume() {
  audio.unlock()
  game.pause()
  await nextTick()
  arena.value?.focus()
}
function openPage(value: 'progress' | 'settings', reset = false) {
  if (status.value === 'playing') game.pause()
  page.value = value
  resetRequested.value = reset
  nextTick(() => document.querySelector<HTMLButtonElement>('.page-heading button')?.focus())
}
function back() {
  page.value = 'game'
  nextTick(() => document.querySelector<HTMLButtonElement>('.overlay .primary')?.focus())
}
function toMenu() {
  status.value = 'menu'
  levelNotice.value = ''
  game.enemies.value = []
  page.value = 'game'
}
function reset() {
  game.score.value = 0
  progress.reset()
  toMenu()
  debugOpen.value = false
}
function changeSettings(settings: Settings) {
  audio.unlock()
  save.value.settings = settings
}
function selectScript(script: KanaScript) {
  save.value.settings.script = script
  debugKana.value = allKana.find((kana) => kana.type === script)!.id
}
function selectKanjiPractice(practice: 'meaning' | 'reading') {
  save.value.settings.kanjiPractice = practice
}
function requestDebugReset() {
  debugOpen.value = false
  openPage('settings', true)
}
function keyboard(event: KeyboardEvent) {
  if (event.isComposing) return
  if (event.key === 'Escape') {
    event.preventDefault()
    if (debugOpen.value) {
      debugOpen.value = false
      return
    }
    if (page.value !== 'game') back()
    else if (status.value === 'playing' || status.value === 'paused') {
      audio.unlock()
      game.pause()
    }
  }
  if (isDev && event.code === 'Backquote') {
    event.preventDefault()
    debugOpen.value = !debugOpen.value
    if (status.value === 'playing') game.pause()
  }
  if (
    status.value === 'playing' &&
    !game.lessonIntro.value &&
    page.value === 'game' &&
    event.target === document.body &&
    /^[a-zA-Z]$/.test(event.key) &&
    !event.ctrlKey &&
    !event.metaKey
  ) {
    arena.value?.focus()
    game.input.value += event.key
    event.preventDefault()
  }
}
function visibility() {
  if (document.hidden && status.value === 'playing') game.pause()
}
onMounted(() => {
  document.addEventListener('keydown', keyboard)
  document.addEventListener('visibilitychange', visibility)
  syncVisibleViewport()
  window.addEventListener('resize', syncVisibleViewport)
  window.visualViewport?.addEventListener('resize', syncVisibleViewport)
})
onUnmounted(() => {
  document.removeEventListener('keydown', keyboard)
  document.removeEventListener('visibilitychange', visibility)
  window.removeEventListener('resize', syncVisibleViewport)
  window.visualViewport?.removeEventListener('resize', syncVisibleViewport)
  document.documentElement.classList.remove('keyboard-open')
  if (noticeTimer) clearTimeout(noticeTimer)
})
</script>
<template>
  <main class="shell" :class="{ 'reduce-motion': save.settings.reducedMotion }">
    <header class="topbar">
      <button
        class="wordmark"
        aria-label="Kanafall, menú principal"
        @click="status === 'playing' ? game.pause() : toMenu()"
      >
        <span>✧</span>
        kanafall
        <span class="wordmark-kana" lang="ja">かな</span>
      </button>
      <span>EL BOSQUE DE LAS LETRAS</span>
      <div class="header-actions">
        <span class="level-badge">✧ Nivel {{ player.level }}</span>
        <nav class="quick-nav" aria-label="Accesos rápidos">
          <button aria-label="Abrir progreso" @click="openPage('progress')">
            <span class="quick-nav-icon" aria-hidden="true">◫</span>
            <span class="quick-nav-label">Progreso</span>
          </button>
          <button aria-label="Abrir ajustes" @click="openPage('settings')">
            <span class="quick-nav-icon" aria-hidden="true">⚙</span>
            <span class="quick-nav-label">Ajustes</span>
          </button>
        </nav>
      </div>
    </header>
    <p v-if="storageWarning" class="storage-warning" role="status">{{ storageWarning }}</p>
    <template v-if="page === 'game'">
      <section class="arena" :class="{ 'menu-arena': status === 'menu' }" aria-label="Campo de juego">
        <GameArena
          ref="arena"
          :game="game"
          :level="player.level"
          :xp="player.xp"
          :required="player.required"
          :level-notice="levelNotice"
          :reduced-motion="save.settings.reducedMotion"
          :hints="save.settings.script !== 'kanji' && pool.reduce((total, kana) => total + (save.mastery[kana.id]?.correct ?? 0), 0) < 6"
          :script="save.settings.script"
          :kanji-practice="save.settings.kanjiPractice"
        />
        <div v-if="status === 'menu'" class="overlay menu-overlay">
          <div class="menu-decoration" aria-hidden="true">
            <span v-for="glyph in currentGroup[1]" :key="glyph" lang="ja">{{ glyph }}</span>
          </div>
          <div class="menu-card">
            <div class="chapter-pill">
              CAPÍTULO {{ Math.min(groups.length, Math.ceil(player.level / 2)) }}
              <span>·</span>
              {{ currentGroup[0] }}
            </div>
            <div class="script-picker" role="group" aria-label="Sistema de escritura">
              <button
                v-for="script in ['hiragana', 'katakana', 'kanji'] as const"
                :key="script"
                :class="{ active: save.settings.script === script }"
                :aria-pressed="save.settings.script === script"
                @click="selectScript(script)"
              >
                <span lang="ja">{{ script === 'hiragana' ? 'あ' : script === 'katakana' ? 'ア' : '山' }}</span>
                {{ script === 'hiragana' ? 'Hiragana' : script === 'katakana' ? 'Katakana' : 'Kanji' }}
              </button>
            </div>
            <h1>
              Kanafall
              <span>かなの森</span>
            </h1>
            <div v-if="save.settings.script === 'kanji'" class="kanji-practice-picker">
              <span>¿QUÉ QUERÉS PRACTICAR?</span>
              <div role="group" aria-label="Tipo de práctica de kanji">
                <button
                  :class="{ active: save.settings.kanjiPractice === 'meaning' }"
                  :aria-pressed="save.settings.kanjiPractice === 'meaning'"
                  @click="selectKanjiPractice('meaning')"
                >
                  Significados <small>Español</small>
                </button>
                <button
                  :class="{ active: save.settings.kanjiPractice === 'reading' }"
                  :aria-pressed="save.settings.kanjiPractice === 'reading'"
                  @click="selectKanjiPractice('reading')"
                >
                  Lecturas <small>Romaji</small>
                </button>
              </div>
            </div>
            <p v-else class="menu-subtitle">
              Un pequeño espíritu.
              <br />
              Un mundo por aprender.
            </p>
            <div class="companion-stage">
              <div class="orbit"></div>
              <Spirit :level="player.level" />
              <span>
                NILO
                <i>·</i>
                TU COMPAÑERO
              </span>
            </div>
            <button class="primary" :disabled="!ready" @click="start">
              {{
                save.settings.script === 'kanji'
                  ? save.settings.kanjiPractice === 'meaning'
                    ? 'Practicar significados'
                    : 'Practicar lecturas'
                  : save.statistics.runs
                    ? 'Volver al bosque'
                    : 'Jugar'
              }}
              <span>↗</span>
            </button>
            <nav class="menu-links" aria-label="Menú principal">
              <button @click="openPage('progress')">Tu progreso</button>
              <span>·</span>
              <button @click="openPage('settings')">Ajustes</button>
            </nav>
            <p class="how-to">
              {{
                save.settings.script === 'kanji'
                  ? save.settings.kanjiPractice === 'meaning'
                    ? 'Mirá el kanji y respondé qué significa en español.'
                    : 'Mirá el kanji y escribí su lectura en romaji.'
                  : `Leé el ${save.settings.script}. Escribí su romaji.`
              }}
              <kbd>Enter ↵</kbd>
            </p>
            <button class="reset-link" @click="openPage('settings', true)">Restablecer guardado</button>
          </div>
        </div>
        <div v-else-if="status === 'paused' || status === 'over'" class="overlay">
          <div class="menu-card pause-card">
            <p class="eyebrow">
              {{ status === 'paused' ? 'EL BOSQUE PUEDE ESPERAR' : 'CADA INTENTO TE HACE CRECER' }}
            </p>
            <h1>{{ status === 'paused' ? 'Un respiro' : 'Buen viaje' }}</h1>
            <Spirit :state="status === 'over' ? 'game-over' : 'idle'" :level="player.level" />
            <p>
              {{
                status === 'paused'
                  ? 'Tu aventura sigue justo donde la dejaste.'
                  : 'Nilo descansa. Todo lo aprendido queda con vos.'
              }}
            </p>
            <div v-if="status === 'over'" class="run-summary">
              <div>
                <b>{{ score }}</b>
                <span>Puntos</span>
              </div>
              <div>
                <b>+{{ runXp }}</b>
                <span>XP ganada</span>
              </div>
              <div>
                <b>×{{ runBest }}</b>
                <span>Mejor racha</span>
              </div>
              <div>
                <b>{{ runAccuracy }}%</b>
                <span>Precisión</span>
              </div>
            </div>
            <button class="primary" @click="status === 'paused' ? resume() : start()">
              {{ status === 'paused' ? 'Continuar' : 'Otra aventura' }}
              <span>↗</span>
            </button>
            <div class="menu-links">
              <button v-if="status === 'paused'" @click="start">Reiniciar partida</button>
              <button v-else @click="openPage('progress')">Ver progreso</button>
              <button @click="toMenu">Menú principal</button>
            </div>
            <button v-if="status === 'paused'" class="reset-link" @click="openPage('settings')">
              Ajustes
            </button>
          </div>
        </div>
      </section>
      <footer class="game-footer">
        <span>
          <span class="save-symbol">⌑</span>
          Tu progreso se guarda en este navegador
        </span>
        <span v-if="nextGroup">
          Próximo descubrimiento
          <b lang="ja">{{ nextGroup[1] }}</b>
          · Nv. {{ Math.ceil(player.level / 2) * 2 + 1 }}
        </span>
        <span v-else>Las 46 letras están en tu bosque.</span>
      </footer>
    </template>
    <ProgressScreen
      v-else-if="page === 'progress'"
      :save="save"
      :accuracy="accuracy"
      :script="save.settings.script"
      @back="back"
      @script="selectScript"
    />
    <SettingsScreen
      v-else
      :settings="save.settings"
      :reset-requested="resetRequested"
      :last-saved-at="lastSavedAt"
      :save-message="saveMessage"
      @back="back"
      @change="changeSettings"
      @export-save="progress.downloadBackup"
      @import-save="progress.importBackup"
      @reset="reset"
    />
    <aside v-if="isDev && debugOpen" class="debug-panel">
      <h2>Development · ` para cerrar</h2>
      <button @click="progress.addXp(100)">+100 XP</button>
      <button @click="progress.addXp(xpToNextLevel(player.level) - player.xp)">Subir nivel</button>
      <label>
        Velocidad
        <input v-model.number="game.speed.value" type="range" min=".2" max="10" step=".2" />
      </label>
      <select v-model="debugKana" aria-label="Kana de prueba">
        <option v-for="k in allKana" :key="k.id" :value="k.id">
          {{ k.character }} · {{ k.romaji[0] }}{{ k.meaning ? ` · ${k.meaning}` : '' }} · {{ scriptJapanese(k.type) }}
        </option>
      </select>
      <button @click="game.spawn(debugKana)">Crear letra</button>
      <button @click="game.enemies.value = []">Limpiar letras</button>
      <button @click="requestDebugReset">Restablecer guardado</button>
    </aside>
  </main>
</template>
