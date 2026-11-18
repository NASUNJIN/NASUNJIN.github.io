<script setup lang="ts">
  import AppIcon from '../ui/AppIcon.vue'

  const nav = [
    { to: '/overview', label: 'Overview', icon: 'grid' },
    { to: '/leaderboard', label: 'Leaderboard', icon: 'trophy' },
    { to: '/data', label: 'Data', icon: 'database' },
    { to: '/submit', label: '제출 안내', icon: 'upload' },
  ] as const
</script>

<template>
  <div class="app-shell min-h-screen bg-slate-50 text-slate-900">
    <header class="topbar sticky top-0 z-20 flex items-center border-b border-slate-200 bg-white">
      <RouterLink
        class="brand"
        to="/overview">
        <span class="brand-mark">
          <AppIcon name="spark" />
        </span>
        <span>
          <strong class="font-extrabold">Agent Challenge</strong>
          <small>2026</small>
        </span>
      </RouterLink>
      <nav
        class="main-nav flex items-stretch"
        aria-label="주 메뉴">
        <RouterLink
          v-for="item in nav"
          :key="item.to"
          :to="item.to">
          <AppIcon :name="item.icon" />{{ item.label }}
        </RouterLink>
      </nav>
    </header>
    <main class="page-container mx-auto w-full h-full"><slot /></main>
  </div>
</template>
