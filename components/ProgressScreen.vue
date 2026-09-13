<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { groupsFor, kanaFor, type KanaScript } from '../data/kana'
import { emptyMastery, masteryLabel } from '../game/rules'
import type { Save } from '../game/save'
const props = defineProps<{ save: Save; accuracy: number; script: KanaScript }>()
defineEmits<{ back: []; script: [script: KanaScript] }>()
const kana = computed(() => kanaFor(props.script))
const groups = computed(() => groupsFor(props.script))
const path = computed(() => props.save.player.paths[props.script])
const selected = ref(kana.value[0]!)
watch(
  () => props.script,
  () => (selected.value = kana.value[0]!),
)
const detail = computed(() => props.save.mastery[selected.value.id] ?? emptyMastery())
const unlocked = (id: string) => props.save.unlocked.includes(id)
</script>
<template>
  <section class="page-panel progress-page">
    <div class="page-heading">
      <div>
        <p class="eyebrow">CADA LETRA DEJA HUELLA</p>
        <h1>Tu recorrido</h1>
      </div>
      <button autofocus @click="$emit('back')">← Volver</button>
    </div>
    <div class="progress-script-picker" role="group" aria-label="Colección">
      <button
        v-for="item in ['hiragana', 'katakana'] as const"
        :key="item"
        :class="{ active: script === item }"
        :aria-pressed="script === item"
        @click="$emit('script', item)"
      >
        <span lang="ja">{{ item === 'hiragana' ? 'あ' : 'ア' }}</span>
        {{ item === 'hiragana' ? 'Hiragana' : 'Katakana' }}
      </button>
    </div>
    <div class="progress-stats">
      <div>
        <b>{{ path.level }}</b>
        <span>Nivel en {{ script }}</span>
      </div>
      <div>
        <b>{{ path.totalXp }}</b>
        <span>XP en {{ script }}</span>
      </div>
      <div>
        <b>×{{ save.statistics.bestCombo }}</b>
        <span>Mejor racha</span>
      </div>
      <div>
        <b>{{ save.statistics.correct }}</b>
        <span>Aciertos</span>
      </div>
      <div>
        <b>{{ accuracy }}%</b>
        <span>Precisión</span>
      </div>
    </div>
    <div class="collection-layout">
      <div>
        <div class="section-title">
          <h2>Tu colección de {{ script }}</h2>
          <span>{{ kana.filter((k) => unlocked(k.id)).length }} / 46 desbloqueados</span>
        </div>
        <div class="kana-rows">
          <div v-for="(group, index) in groups" :key="group[0]" class="kana-row">
            <span class="group-label">
              {{ group[0] }}
              <small v-if="index * 2 + 1 > path.level">Nivel {{ index * 2 + 1 }}</small>
            </span>
            <div class="kana-cells">
              <button
                v-for="k in kana.filter((k) => k.group === index)"
                :key="k.id"
                :class="{ selected: selected.id === k.id, locked: !unlocked(k.id) }"
                :aria-pressed="selected.id === k.id"
                :aria-label="`${k.character}, ${unlocked(k.id) ? masteryLabel(save.mastery[k.id]?.masteryScore ?? 0) : 'Bloqueado'}`"
                @click="selected = k"
              >
                <span lang="ja">{{ k.character }}</span>
                <i :style="{ width: (save.mastery[k.id]?.masteryScore ?? 0) * 100 + '%' }"></i>
              </button>
            </div>
          </div>
        </div>
        <p class="collection-note">
          La precisión cuenta respuestas y letras que se escaparon. El dominio crece con la práctica.
        </p>
      </div>
      <aside class="kana-detail">
        <p class="eyebrow">{{ unlocked(selected.id) ? 'TU LETRA' : 'POR DESCUBRIR' }}</p>
        <div class="detail-character" lang="ja">{{ selected.character }}</div>
        <h2>{{ selected.romaji[0] }}</h2>
        <span class="mastery-badge">
          {{
            unlocked(selected.id)
              ? masteryLabel(detail.masteryScore)
              : `Se abre en nivel ${selected.group * 2 + 1}`
          }}
        </span>
        <dl>
          <div>
            <dt>Precisión</dt>
            <dd>{{ detail.attempts ? Math.round((detail.correct / detail.attempts) * 100) + '%' : '—' }}</dd>
          </div>
          <div>
            <dt>Intentos</dt>
            <dd>{{ detail.attempts }}</dd>
          </div>
          <div>
            <dt>Racha actual</dt>
            <dd>{{ detail.currentStreak }}</dd>
          </div>
          <div>
            <dt>Dominio</dt>
            <dd>{{ Math.round(detail.masteryScore * 100) }}%</dd>
          </div>
        </dl>
        <p>Las letras que más cuestan vuelven un poco más seguido.</p>
      </aside>
    </div>
  </section>
</template>
