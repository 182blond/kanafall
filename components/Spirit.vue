<script setup lang="ts">
withDefaults(defineProps<{ state?: string; level?: number }>(), { state: 'idle', level: 1 })
</script>
<template>
  <div
    class="spirit"
    :class="[state, { evolved: level >= 5, radiant: level >= 20 }]"
    role="img"
    aria-label="Nilo, tu espíritu del bosque"
  >
    <div class="spirit-aura"></div>
    <svg viewBox="0 0 140 160" aria-hidden="true">
      <ellipse cx="70" cy="145" rx="35" ry="8" fill="#071d20" opacity=".65" />
      <g class="spirit-body">
        <path d="M47 109 41 131 57 127 66 135 76 126 92 132 94 109" fill="#76bda8" />
        <path
          d="M69 34C44 34 32 58 33 82L23 112 47 107Q70 122 94 106L114 110 105 80C105 52 90 34 69 34Z"
          fill="#d5edbc"
        />
        <path d="M34 79Q70 115 105 79L108 101Q70 128 29 101Z" fill="#87c5aa" />
        <ellipse cx="68" cy="72" rx="24" ry="20" fill="#173e3c" />
        <ellipse cx="59" cy="71" rx="3.3" ry="5" fill="#dcf7cd" />
        <ellipse cx="77" cy="71" rx="3.3" ry="5" fill="#dcf7cd" />
        <path d="M65 82Q68 85 72 81" fill="none" stroke="#dcf7cd" stroke-width="2" stroke-linecap="round" />
        <path d="M69 38Q43 25 50 13Q72 13 72 36Q79 9 96 14Q98 33 69 38" fill="#bcdf7c" />
        <path d="m67 97 5 6-5 6-5-6Z" fill="#ffe2a4" />
      </g>
      <g class="staff">
        <path d="m104 126 9-64" stroke="#cda67a" stroke-width="5" stroke-linecap="round" />
        <path d="m114 41 10 15-12 15-10-14Z" :fill="level >= 10 ? '#c3adff' : '#d8f894'" />
        <path d="m112 49 5 7-5 8" stroke="white" fill="none" opacity=".7" />
      </g>
    </svg>
  </div>
</template>
