<script setup lang="ts">
  defineProps<{ title: string; subtitle?: string }>()
</script>
<template>
  <main class="auth-page">
    <div class="auth-glow auth-glow-one" aria-hidden="true"></div>
    <div class="auth-glow auth-glow-two" aria-hidden="true"></div>
    <div class="auth-grid" aria-hidden="true"></div>
    <div class="auth-content">
      <header class="auth-intro">
        <span class="auth-kicker">MULTI-ROBOT HACKATHON · 2026</span>
        <h1 class="auth-title" aria-label="Agent Challenge">
          <span aria-hidden="true">Agent Challenge</span>
        </h1>
        <p>함께 탐색하고, 더 나은 답을 찾습니다.</p>
      </header>
      <section class="auth-card" :aria-label="title">
        <div class="auth-card-heading">
          <h2><strong>{{ title }}</strong></h2>
          <p>{{ subtitle }}</p>
        </div>
        <slot />
      </section>
      <p class="auth-footer">AGENT CHALLENGE 2026</p>
    </div>
  </main>
</template>
