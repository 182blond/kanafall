<script setup lang="ts">
withDefaults(defineProps<{ state?: string; level?: number }>(), { state: 'idle', level: 1 })

const companionSrc = `${useRuntimeConfig().app.baseURL}companion.png`
</script>
<template>
  <div
    class="spirit"
    :class="[state, { evolved: level >= 5, radiant: level >= 20 }]"
    role="img"
    aria-label="Nilo, tu espíritu del bosque"
  >
    <div class="spirit-aura"></div>
    <div class="spirit-shadow" aria-hidden="true"></div>
    <img class="spirit-body" :src="companionSrc" alt="" aria-hidden="true" />
  </div>
</template>
