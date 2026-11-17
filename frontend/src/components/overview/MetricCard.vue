<script setup lang="ts">
  withDefaults(
    defineProps<{
      label: string
      value: string | number
      hint: string
      tone?: 'blue' | 'orange' | 'violet' | 'green'
    }>(),
    {
      tone: 'blue',
    },
  )
</script>
<template>
  <article class="metric-card">
    <div
      class="metric-icon"
      :class="tone">
      <slot />
    </div>
    <div>
      <p>{{ label }}</p>
      <strong>{{ value }}</strong>
      <small class="font-semibold">{{ hint }}</small>
    </div>
  </article>
</template>
