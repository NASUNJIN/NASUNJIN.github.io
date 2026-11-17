<script setup lang="ts">
  import { computed } from 'vue'
  import { useRoute } from 'vue-router'
  import AppShell from './components/layout/AppShell.vue'

  const route = useRoute()
  const isAuthPage = computed(() => route.meta.layout === 'auth')
</script>

<template>
  <RouterView v-if="isAuthPage" />
  <AppShell v-else><RouterView /></AppShell>
</template>
