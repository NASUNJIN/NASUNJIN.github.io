<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import AuthPanel from '../components/auth/AuthPanel.vue'
import type { UserRole } from '../types/challenge'

type FieldName = 'teamName' | 'email' | 'password' | 'passwordConfirm'
const router = useRouter()
const auth = useAuthStore()
const isSubmitting = ref(false)
const submitted = ref(false)
const serverError = ref('')
const touched = reactive<Record<FieldName, boolean>>({ 
  teamName: false, 
  email: false, 
  password: false, 
  passwordConfirm: false 
})
const form = reactive({ 
  role: 'USER' as UserRole, 
  teamName: '', 
  email: '', 
  password: '', passwordConfirm: '' 
})

const errors = computed<Record<FieldName, string>>(() => ({
  teamName: form.role === 'USER'
    ? !form.teamName.trim() ? '참가팀은 팀 이름을 입력해 주세요.'
      : form.teamName.trim().length > 30 ? '팀 이름은 30자 이하로 입력해 주세요.' : ''
    : '',
  email: !form.email.trim() ? '이메일을 입력해 주세요.'
    : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) ? '올바른 이메일 형식으로 입력해 주세요.' : '',
  password: !form.password ? '비밀번호를 입력해 주세요.'
    : form.password.length < 8 || form.password.length > 20 ? '비밀번호는 8~20자로 입력해 주세요.'
      : !/[A-Za-z]/.test(form.password) || !/\d/.test(form.password) ? '영문과 숫자를 각각 하나 이상 포함해 주세요.' : '',
  passwordConfirm: !form.passwordConfirm ? '비밀번호를 한 번 더 입력해 주세요.'
    : form.passwordConfirm !== form.password ? '비밀번호가 일치하지 않습니다.' : '',
}))

watch(() => form.role, (role) => { 
  if (role !== 'USER') 
  form.teamName = '' 
})
function errorFor(field: FieldName) { 
  return submitted.value || touched[field] ? errors.value[field] : '' 
}

async function submit() {
  submitted.value = true
  serverError.value = ''
  if (Object.values(errors.value).some(Boolean) || isSubmitting.value) 
    return isSubmitting.value = true
  try {
    await auth.signup({
      email: form.email.trim().toLowerCase(), 
      password: form.password, 
      role: form.role,
      team_name: form.role === 'USER' ? form.teamName.trim() : null,
    })
    await router.push({ 
      name: 'login', 
      query: { registered: '1' } 
    })
  } catch (requestError) {
    serverError.value = requestError instanceof Error ? requestError.message : '회원가입에 실패했습니다.'
  } finally { isSubmitting.value = false }
}
</script>

<template>
  <AuthPanel title="계정 만들기">
    <form class="auth-form" novalidate @submit.prevent="submit">
      <label>
        권한 
        <small class="dev-badge">개발 테스트용</small>
        <select v-model="form.role" aria-label="권한 선택">
          <option value="USER">참가팀</option>
          <option value="ADMIN">운영자</option>
          <option value="MASTER">마스터</option>
        </select>
      </label>
      <label v-if="form.role === 'USER'">
        팀 이름
        <input v-model="form.teamName" :aria-invalid="Boolean(errorFor('teamName'))" autocomplete="organization"
          maxlength="100" placeholder="예: Ember-Lab" @blur="touched.teamName = true" />
        <span v-if="errorFor('teamName')" class="field-error">{{ errorFor('teamName') }}</span>
      </label>
      <label>
        이메일
        <input v-model.trim="form.email" :aria-invalid="Boolean(errorFor('email'))" autocomplete="email"
          inputmode="email" maxlength="254" placeholder="team@example.com" type="email" @blur="touched.email = true" />
        <span v-if="errorFor('email')" class="field-error">{{ errorFor('email') }}</span>
      </label>
      <label>
        비밀번호
        <input v-model="form.password" :aria-invalid="Boolean(errorFor('password'))" autocomplete="new-password"
          maxlength="20" placeholder="영문과 숫자를 포함한 8자 이상" type="password" @blur="touched.password = true" />
        <span v-if="errorFor('password')" class="field-error">{{ errorFor('password') }}</span>
      </label>
      <label>
        비밀번호 확인
        <input v-model="form.passwordConfirm" :aria-invalid="Boolean(errorFor('passwordConfirm'))" autocomplete="new-password"
          maxlength="20" placeholder="비밀번호를 다시 입력해 주세요" type="password" @blur="touched.passwordConfirm = true" />
        <span v-if="errorFor('passwordConfirm')" class="field-error">{{ errorFor('passwordConfirm') }}</span>
      </label>
      <p v-if="serverError" class="form-error" role="alert">{{ serverError }}</p>
      <button class="primary-button" :disabled="isSubmitting" type="submit">{{ isSubmitting ? '가입 처리 중...' : '회원가입' }}</button>
    </form>
    <p class="auth-link">이미 계정이 있나요? 
      <RouterLink to="/login">로그인</RouterLink>
    </p>
  </AuthPanel>
</template>
