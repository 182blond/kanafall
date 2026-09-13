<script setup lang="ts">
import { ref } from 'vue'
import type { Settings } from '../game/save'
const props = defineProps<{ settings: Settings; resetRequested: boolean }>()
const emit = defineEmits<{ back: []; change: [settings: Settings]; reset: [] }>()
const confirming = ref(props.resetRequested)
function confirmReset() {
  confirming.value = false
  emit('reset')
}
function toggle(key: 'sound' | 'music' | 'reducedMotion') {
  emit('change', { ...props.settings, [key]: !props.settings[key] })
}
function changeSpeed(event: Event) {
  emit('change', { ...props.settings, speed: Number((event.target as HTMLSelectElement).value) })
}
</script>
<template>
  <section class="page-panel settings-page">
    <div class="page-heading">
      <div>
        <p class="eyebrow">A TU RITMO</p>
        <h1>Ajustes</h1>
      </div>
      <button autofocus @click="$emit('back')">← Volver</button>
    </div>
    <div class="settings-list">
      <div
        v-for="item in [
          ['sound', 'Efectos de sonido', 'Pequeñas notas para cada hechizo.'],
          ['music', 'Música del bosque', 'Una melodía suave para acompañarte.'],
          ['reducedMotion', 'Reducir movimiento', 'Menos partículas, destellos y animaciones.'],
        ] as const"
        :key="item[0]"
        class="setting-row"
      >
        <div>
          <h2>{{ item[1] }}</h2>
          <p>{{ item[2] }}</p>
        </div>
        <button
          class="toggle"
          role="switch"
          :aria-checked="settings[item[0]]"
          :aria-label="item[1]"
          @click="toggle(item[0])"
        >
          <span></span>
        </button>
      </div>
      <div class="setting-row">
        <div>
          <h2>Velocidad de juego</h2>
          <p>El aprendizaje no es una carrera.</p>
        </div>
        <select :value="settings.speed" aria-label="Velocidad de juego" @change="changeSpeed">
          <option :value="0.65">Tranquila · 0,65×</option>
          <option :value="1">Normal · 1×</option>
          <option :value="1.5">Ágil · 1,5×</option>
        </select>
      </div>
    </div>
    <div class="save-note">
      <span>⌑</span>
      <p>
        Tu aventura se guarda automáticamente en este navegador.
        <br />
        No necesitás una cuenta ni conexión durante el juego.
      </p>
    </div>
    <div class="reset-zone">
      <template v-if="!confirming">
        <div>
          <h2>Empezar de cero</h2>
          <p>Borra niveles, estadísticas y ajustes de este navegador.</p>
        </div>
        <button class="danger" @click="confirming = true">Restablecer progreso</button>
      </template>
      <template v-else>
        <p role="alert">¿Borrar todo tu progreso? Esta acción no se puede deshacer.</p>
        <div class="flex gap-3">
          <button @click="confirming = false">Conservar mi aventura</button>
          <button class="danger" @click="confirmReset">Sí, borrar progreso</button>
        </div>
      </template>
    </div>
  </section>
</template>
