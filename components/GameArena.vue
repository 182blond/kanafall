<script setup lang="ts">
import { nextTick, onUnmounted, ref, watch } from 'vue'
import type { useGame } from '../composables/useGame'
import { scriptLabel, type KanaScript } from '../data/kana'
import Spirit from './Spirit.vue'
const props = defineProps<{
  game: ReturnType<typeof useGame>
  level: number
  xp: number
  required: number
  levelNotice: string
  reducedMotion: boolean
  hints: boolean
  script: KanaScript
}>()
const { enemies, input, score, combo, hp, status, heroState, feedback, wrongCount } = props.game
const field = ref<HTMLInputElement>(),
  error = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined
const focus = () => {
  if (status.value === 'playing') field.value?.focus({ preventScroll: true })
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
})
defineExpose({ focus })
function submit() {
  props.game.submit()
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
        :class="[enemy.state, { urgent: enemy.y > 65 }]"
        :style="{ left: enemy.x + '%', top: enemy.y + '%' }"
        :data-kana="enemy.kana.character"
        :data-state="enemy.state"
      >
        <span lang="ja">{{ enemy.kana.character }}</span>
        <span v-if="hints && enemy.state === 'falling'" class="reading">{{ enemy.kana.romaji[0] }}</span>
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
      <p aria-live="polite">{{ feedback || 'Convertí las letras en magia. Escribí su romaji.' }}</p>
      <div class="typing-row">
        <span class="input-spark" aria-hidden="true">✧</span>
        <input
          ref="field"
          v-model="input"
          aria-label="Respuesta en romaji"
          placeholder="Tu hechizo…"
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          maxlength="24"
          :disabled="status !== 'playing'"
        />
        <button type="submit" aria-label="Enviar respuesta">
          Enter
          <span>↵</span>
        </button>
      </div>
    </form>
  </div>
</template>
