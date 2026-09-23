<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import type { useGame } from '../composables/useGame'
import { kanjiPartsFor, scriptLabel, type KanjiPractice, type PracticeScript } from '../data/kana'
import Spirit from './Spirit.vue'
const props = defineProps<{
  game: ReturnType<typeof useGame>
  level: number
  xp: number
  required: number
  levelNotice: string
  reducedMotion: boolean
  hints: boolean
  script: PracticeScript
  kanjiPractice: KanjiPractice
}>()
const { enemies, input, score, combo, hp, status, heroState, feedback, wrongCount, lessonIntro } = props.game
const currentTarget = computed(() =>
  [...enemies.value].filter((enemy) => enemy.state === 'falling').sort((a, b) => b.y - a.y)[0],
)
const introParts = computed(() => (lessonIntro.value ? kanjiPartsFor(lessonIntro.value) : []))
const prompt = computed(() => {
  if (lessonIntro.value) return 'PRÓXIMO PASO · Vas a responder el significado en español.'
  const target = currentTarget.value
  return target?.prompt === 'meaning'
    ? 'SIGNIFICADO · Respondé en español. Ejemplo: montaña.'
    : 'LECTURA · Escribí con letras latinas (romaji). Ejemplo: yama.'
})
const placeholder = computed(() => {
  if (lessonIntro.value) return 'La práctica empieza al continuar…'
  return currentTarget.value?.prompt === 'meaning' ? 'Respuesta en español…' : 'Lectura en romaji…'
})
const field = ref<HTMLInputElement>(),
  introButton = ref<HTMLButtonElement>(),
  error = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined
const focus = () => {
  if (status.value === 'playing' && !lessonIntro.value) field.value?.focus({ preventScroll: true })
}
watch(
  status,
  async (s) => {
    if (s === 'playing') {
      await nextTick()
      focus()
    }
  },
  { immediate: true },
)
watch(lessonIntro, async (word) => {
  if (!word) return
  await nextTick()
  introButton.value?.focus({ preventScroll: true })
})
watch(wrongCount, async () => {
  error.value = false
  await nextTick()
  error.value = true
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    error.value = false
  }, 360)
  field.value?.select()
})
onUnmounted(() => {
  if (timer) clearTimeout(timer)
  document.documentElement.classList.remove('keyboard-open')
})
function keyboardState(open: boolean) {
  document.documentElement.classList.toggle('keyboard-open', open)
  if (open) requestAnimationFrame(() => field.value?.scrollIntoView({ block: 'end' }))
}
defineExpose({ focus })
function submit() {
  props.game.submit()
  focus()
}
async function continueLesson() {
  props.game.continueLesson()
  await nextTick()
  focus()
}
</script>
<template>
  <div class="battle-surface" :class="{ 'is-paused': status === 'paused' }" :inert="status !== 'playing'">
    <div class="hud">
      <span class="score-stat">
        PUNTOS
        <b data-testid="score">{{ score.toLocaleString('es-AR') }}</b>
      </span>
      <div class="xp-stat">
        <span>
          NIVEL
          <b>{{ level }}</b>
        </span>
        <div class="xp-line"><div :style="{ width: (xp / required) * 100 + '%' }"></div></div>
        <small>{{ xp }} / {{ required }} XP</small>
      </div>
      <span class="combo-stat">
        RACHA
        <b :key="combo" :class="{ 'combo-pop': combo > 1 }">×{{ combo }}</b>
      </span>
      <span class="hearts" :aria-label="`${hp} de 5 vidas`">
        <span v-for="n in 5" :key="n" :class="{ empty: n > hp }">♥</span>
      </span>
      <button class="pause-button" aria-label="Pausar partida" @click="game.pause">
        Ⅱ
        <kbd>Esc</kbd>
      </button>
    </div>
    <div class="playfield" @pointerdown="focus">
      <div class="field-caption">
        <span>CLARO DEL BOSQUE</span>
        <span>{{ scriptLabel(script) }} · Nivel {{ level }}</span>
      </div>
      <div v-if="lessonIntro" class="lesson-intro" role="dialog" aria-modal="true" aria-labelledby="new-word-title">
        <p class="eyebrow">NUEVA PALABRA · MIRÁ ANTES DE JUGAR</p>
        <div class="lesson-glyph" lang="ja">{{ lessonIntro.kanji }}</div>
        <div class="lesson-reading" lang="ja">
          {{ lessonIntro.reading }}
          <span>{{ lessonIntro.romaji[0] }}</span>
        </div>
        <h2 id="new-word-title">{{ lessonIntro.meaning }}</h2>
        <div v-if="introParts.length > 1" class="intro-kanji-parts" aria-label="Partes del compuesto">
          <span v-for="part in introParts" :key="part.character">
            <b lang="ja">{{ part.character }}</b>
            {{ part.meaning }}
          </span>
        </div>
        <p v-if="kanjiPractice === 'meaning'">
          En esta sesión practicás el <b>significado</b>: mirá el kanji y respondé qué quiere decir en
          <b>español</b>.
        </p>
        <p v-else>
          En esta sesión practicás la <b>lectura</b>: mirá el kanji y escribí cómo se lee usando
          <b>romaji</b>.
        </p>
        <button ref="introButton" class="primary" @click="continueLesson">Entendido · practicar</button>
      </div>
      <div class="ground-line"></div>
      <svg class="projectiles" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <g v-for="e in enemies.filter((e) => e.state === 'targeted')" :key="e.id">
          <line
            x1="52"
            y1="86"
            :x2="52 + (e.x - 52) * Math.min(1, e.effectAge / 0.18)"
            :y2="86 + (e.y - 86) * Math.min(1, e.effectAge / 0.18)"
            stroke="#d5f796"
            stroke-width=".2"
            opacity=".6"
          />
          <circle
            :cx="52 + (e.x - 52) * Math.min(1, e.effectAge / 0.18)"
            :cy="86 + (e.y - 86) * Math.min(1, e.effectAge / 0.18)"
            r=".65"
            fill="#eeffbc"
          />
        </g>
      </svg>
      <div
        v-for="enemy in enemies"
        :key="enemy.id"
        class="enemy"
        :class="[enemy.state, { urgent: enemy.y > 65, 'kanji-word': enemy.kana.type === 'kanji' }]"
        :style="{ left: enemy.x + '%', top: enemy.y + '%' }"
        :data-kana="enemy.display"
        :data-state="enemy.state"
      >
        <span lang="ja">{{ enemy.display }}</span>
        <span v-if="enemy.state === 'falling' && enemy.readingAid" class="kana-aid" lang="ja">
          {{ enemy.readingAid }}
        </span>
        <span v-if="enemy.state === 'falling' && (enemy.hint || hints)" class="reading">
          {{ enemy.hint || enemy.kana.romaji[0] }}
        </span>
        <small v-if="enemy.state === 'hit'">+{{ enemy.xp }} XP</small>
        <i
          v-for="n in enemy.state === 'hit' && !reducedMotion ? 8 : 0"
          :key="n"
          class="particle"
          :style="{ '--angle': n * 45 + 'deg' }"
        ></i>
      </div>
      <div v-if="levelNotice" class="level-notice" role="status">
        <span>✦ NIVEL {{ level }}</span>
        <small>{{ levelNotice }}</small>
      </div>
      <Spirit :state="heroState" :level="level" class="player" />
      <span class="hero-name">
        NILO
        <span>✧</span>
      </span>
    </div>
    <form class="input-dock" :class="{ 'input-error': error }" @submit.prevent="submit">
      <p :class="{ 'task-prompt': !feedback }" aria-live="polite">{{ feedback || prompt }}</p>
      <div class="typing-row">
        <span class="input-spark" aria-hidden="true">✧</span>
        <input
          ref="field"
          v-model="input"
          :aria-label="prompt"
          :placeholder="placeholder"
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          maxlength="24"
          :disabled="status !== 'playing' || !!lessonIntro"
          @focus="keyboardState(true)"
          @blur="keyboardState(false)"
        />
        <button type="submit" aria-label="Enviar respuesta">
          Enter
          <span>↵</span>
        </button>
      </div>
    </form>
  </div>
</template>
