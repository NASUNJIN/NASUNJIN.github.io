<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import AuthPanel from '../components/auth/AuthPanel.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const form = reactive({ email: '', password: '' })
const error = ref('')
const isSubmitting = ref(false)

async function submit() {
  error.value = ''
  if (!form.email.trim() || !form.password) {
    error.value = '이메일과 비밀번호를 입력해 주세요.'
    return
  }
  isSubmitting.value = true
  try {
    await auth.login({ 
      email: form.email.trim().toLowerCase(), 
      password: form.password 
    })
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/overview'
    await router.push(redirect)
  } catch (requestError) {
    error.value = requestError instanceof Error ? requestError.message : '로그인에 실패했습니다.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <AuthPanel title="다시 만나 반갑습니다" subtitle="계정에 로그인해 대시보드를 확인하세요.">
    <form class="auth-form" novalidate @submit.prevent="submit">
      <label>이메일
        <input v-model.trim="form.email" type="email" autocomplete="email" inputmode="email"
          maxlength="254" placeholder="name@team.com" />
      </label>
      <label>비밀번호
        <input v-model="form.password" type="password" autocomplete="current-password"
          maxlength="20" placeholder="비밀번호를 입력해 주세요" />
      </label>
      <p v-if="error" class="form-error" role="alert">{{ error }}</p>
      <button class="primary-button" :disabled="isSubmitting" type="submit">
        {{ isSubmitting ? '로그인 중...' : '로그인' }}
      </button>
    </form>
    <p class="auth-link">아직 계정이 없나요? 
      <RouterLink to="/register">회원가입</RouterLink>
    </p>
  </AuthPanel>
</template>
