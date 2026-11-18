<script setup lang="ts">
  import { onMounted } from 'vue'
  import AppShell from './components/layout/AppShell.vue'
  import { useChallengeStore } from './stores/challenge'

  const store = useChallengeStore()
  onMounted(() => store.load())
</script>

<template>
  <AppShell>
    <RouterView />
    </AppShell>
</template>
