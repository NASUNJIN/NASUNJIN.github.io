<script setup lang="ts">
  import { useRouter } from 'vue-router'
  import { useAuthStore } from '../../stores/auth'
  import AppIcon from '../ui/AppIcon.vue'

  const router = useRouter()
  const auth = useAuthStore()
  const nav = [
    { to: '/overview', label: 'Overview', icon: 'grid' },
    { to: '/leaderboard', label: 'Leaderboard', icon: 'trophy' },
    { to: '/data', label: 'Data', icon: 'database' },
    { to: '/submit', label: 'Submit', icon: 'upload' },
  ] as const
  function signOut() {
    auth.logout()
    router.push('/login')
  }
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
        <RouterLink
          v-if="auth.isAdmin"
          to="/admin"
          ><AppIcon name="settings" />Admin</RouterLink
        >
      </nav>
      <div class="user-area">
        <span class="live-dot"></span>
        <span class="event-live">대회 운영 중</span>
        <button
          class="profile-button"
          type="button"
          @click="signOut"
          title="로그아웃">
          <span class="avatar">{{ auth.user?.name?.charAt(0) }}</span>
          <span class="profile-copy">
            <b>{{ auth.user?.name }}</b>
            <small>{{ auth.user?.role === 'MASTER' ? '마스터' : auth.isAdmin ? '운영자' : '참가 팀' }}</small>
          </span>
          <AppIcon name="logout" />
        </button>
      </div>
    </header>
    <main class="page-container mx-auto w-full h-full"><slot /></main>
  </div>
</template>
