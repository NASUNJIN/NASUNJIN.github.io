import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { AuthUser, LoginInput, UserRole } from '../types/challenge'
import { apiRequest } from '../services/api'

interface AuthResponse {
  token: string
  user: Omit<AuthUser, 'name'>
}

interface SignupInput extends LoginInput {
  role: UserRole
  team_name: string | null
}

export const useAuthStore = defineStore('auth', () => {
  const saved = JSON.parse(localStorage.getItem('ac26-user') || 'null') as AuthUser | null
  const user = ref<AuthUser | null>(saved)
  const token = ref(localStorage.getItem('ac26-token'))
  function tokenExpired(value: string | null) {
    if (!value) return true
    try {
      const payload = JSON.parse(atob(value.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))) as { exp?: number }
      return typeof payload.exp !== 'number' || payload.exp * 1000 <= Date.now()
    } catch { return true }
  }
  const isAuthenticated = computed(() => Boolean(user.value && !tokenExpired(token.value)))
  const isAdmin = computed(() => user.value?.role === 'ADMIN' || user.value?.role === 'MASTER')

  async function login(input: LoginInput) {
    const response = await apiRequest<AuthResponse>('/login', {
      method: 'POST',
      body: JSON.stringify(input),
    })
    token.value = response.token
    user.value = { ...response.user, name: response.user.team_name || roleLabel(response.user.role) }
    localStorage.setItem('ac26-token', response.token)
    localStorage.setItem('ac26-user', JSON.stringify(user.value))
  }

  async function signup(input: SignupInput) {
    await apiRequest<{ user: Omit<AuthUser, 'name'> }>('/signup', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  }

  function roleLabel(role: UserRole) {
    return role === 'MASTER' ? '마스터' : role === 'ADMIN' ? '운영자' : '참가팀'
  }

  function logout() {
    user.value = null
    token.value = null
    localStorage.removeItem('ac26-user')
    localStorage.removeItem('ac26-token')
  }
  return { user, token, isAuthenticated, isAdmin, login, signup, logout }
})
