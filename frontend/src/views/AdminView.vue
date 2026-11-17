<script setup lang="ts">
  import { computed, onMounted, onUnmounted, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useChallengeStore } from '../stores/challenge'
  import { useAuthStore } from '../stores/auth'
  import { ApiError, apiRequest } from '../services/api'
  import AppIcon from '../components/ui/AppIcon.vue'
  const store = useChallengeStore()
  const tab = ref('users')
  import type { UserRole } from '../types/challenge'
  interface Participant { 
    id: string; 
    email: string; 
    role: UserRole; 
    team_name: string | null; 
    created_at: string; 
    selectedRole: UserRole; 
    draftTeamName: string 
  }
  const participants = ref<Participant[]>([])
  const loading = ref(false)
  const savingId = ref<string | null>(null)
  const editingId = ref<string | null>(null)
  const toast = ref('')
  let toastTimer: ReturnType<typeof setTimeout> | undefined
  const error = ref('')
  const auth = useAuthStore()
  const router = useRouter()
  const allowedRoles = computed<UserRole[]>(
    () => auth.user?.role === 'MASTER' ? ['MASTER', 'ADMIN', 'USER'] : ['ADMIN', 'USER']
  )
  function displayRole(role: UserRole) { 
    return role === 'MASTER' ? '마스터' : role === 'ADMIN' ? '운영자' : '참가팀' 
  }
  async function handleError(cause: unknown) {
    if (cause instanceof ApiError && cause.status === 401) {
      auth.logout()
      await router.replace({ name: 'login', query: { redirect: '/admin' } })
      return
    }
    error.value = cause instanceof Error ? cause.message : '요청에 실패했습니다.'
  }
  async function loadParticipants() {
    loading.value = true
    error.value = ''
    try {
      const data = await apiRequest<{ users: Participant[] }>('/admin/users', {
        headers: { Authorization: `Bearer ${auth.token}` },
      })
      participants.value = data.users.map((user) => ({ ...user, selectedRole: user.role, draftTeamName: user.team_name || '' }))
      editingId.value = null
    } catch (cause) {
      await handleError(cause)
    } finally { loading.value = false }
  }
  function startEditing(user: Participant) {
    if (editingId.value) {
      const previous = participants.value.find((item) => item.id === editingId.value)
      if (previous) cancelEditing(previous)
    }
    error.value = ''
    editingId.value = user.id
  }
  function cancelEditing(user: Participant) {
    user.selectedRole = user.role
    user.draftTeamName = user.team_name || ''
    editingId.value = null
    error.value = ''
  }
  function showToast(message: string) {
    toast.value = message
    if (toastTimer) clearTimeout(toastTimer)
    toastTimer = setTimeout(() => { toast.value = '' }, 3500)
  }
  onUnmounted(() => { if (toastTimer) clearTimeout(toastTimer) })
  async function saveRole(user: Participant) {
    if (user.selectedRole === user.role && user.draftTeamName.trim() === (user.team_name || '')) {
      editingId.value = null
      return
    }
    if (user.selectedRole === 'USER' && !user.draftTeamName.trim()) {
      error.value = '참가팀으로 변경하려면 팀 이름을 입력해 주세요.'
      return
    }
    if (user.selectedRole === 'USER' && user.draftTeamName.trim().length > 30) {
      error.value = '팀 이름은 30자 이하로 입력해 주세요.'
      return
    }
    error.value = ''
    savingId.value = user.id
    try {
      const data = await apiRequest<{ user: Omit<Participant, 'selectedRole' | 'draftTeamName'> }>(`/admin/users/${user.id}/role`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({ 
          role: user.selectedRole, 
          team_name: user.draftTeamName.trim() || null 
        }),
      })
      Object.assign(user, data.user, { 
        selectedRole: data.user.role, 
        draftTeamName: data.user.team_name || '' 
      })
      editingId.value = null
      showToast('계정 정보가 저장되었습니다.')
    } catch (cause) { await handleError(cause) }
    finally { savingId.value = null }
  }
  onMounted(loadParticipants)
</script>

<template>
  <div class="page-stack flex flex-col gap-6">
    <div class="page-heading">
      <div>
        <span class="eyebrow">OPERATOR CONSOLE</span>
        <h1><strong>운영자 페이지</strong></h1>
        <p class="font-medium">참가자 계정, 배포 자료와 채점 대기열을 관리합니다.</p>
      </div>
    </div>
    <div class="admin-tabs">
      <button
        :class="{ active: tab === 'users' }"
        @click="tab = 'users'">
        유저 관리
      </button>
      <button
        :class="{ active: tab === 'files' }"
        @click="tab = 'files'">
        파일 관리
      </button>
      <button
        :class="{ active: tab === 'queue' }"
        @click="tab = 'queue'">
        채점 대기열
      </button>
    </div>
    <section
      v-if="tab === 'users'"
      class="panel">
      <div class="panel-heading">
        <div>
          <h2><strong>계정 및 권한</strong></h2>
          <p class="font-medium">{{ participants.length }}개 계정</p>
        </div>
        <button class="primary-button compact" :disabled="loading" @click="loadParticipants">
          새로고침
        </button>
      </div>
      <p v-if="error" class="form-error" role="alert">{{ error }}</p>
      <div v-if="toast" class="admin-toast" role="status" aria-live="polite">{{ toast }}</div>
      <p v-if="loading">계정을 불러오는 중...</p>
      <div class="admin-table-wrap">
        <table class="admin-table">
          <colgroup><col class="admin-col-email" /><col class="admin-col-team" /><col class="admin-col-role" /><col class="admin-col-date" /><col class="admin-col-actions" /></colgroup>
          <thead>
            <tr>
              <th>이메일</th>
              <th>팀 이름</th>
              <th>권한</th>
              <th>가입일</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="u in participants"
              :key="u.id">
              <td>{{ u.email }}</td>
              <td>
                <input v-if="editingId === u.id && u.selectedRole === 'USER'" v-model="u.draftTeamName"
                  class="admin-team-input" maxlength="30" :aria-label="`${u.email} 팀 이름`" placeholder="팀 이름" />
                <b v-else>{{ u.team_name || '—' }}</b>
              </td>
              <td>
                <div v-if="editingId === u.id" class="admin-select-wrap" :class="`role-${u.selectedRole.toLowerCase()}`">
                  <select v-model="u.selectedRole" :aria-label="`${u.email} 변경할 권한`">
                    <option v-for="role in allowedRoles" :key="role" :value="role">{{ displayRole(role) }}</option>
                  </select>
                </div>
                <span v-else class="admin-role-badge" :class="`role-${u.role.toLowerCase()}`">{{ displayRole(u.role) }}</span>
              </td>
              <td>{{ new Date(u.created_at).toLocaleDateString('ko-KR') }}</td>
              <td>
                <span v-if="String(auth.user?.id) === String(u.id)">본인 계정</span>
                <div v-else class="admin-row-actions">
                  <template v-if="editingId === u.id">
                    <button class="table-action admin-save" :disabled="savingId === u.id" @click="saveRole(u)">{{ savingId === u.id ? '저장 중...' : '저장' }}</button>
                    <button class="table-action" :disabled="savingId === u.id" @click="cancelEditing(u)">취소</button>
                  </template>
                  <button v-else class="table-action" @click="startEditing(u)">수정</button>
                </div>
              </td>
            </tr>
            <tr v-if="!loading && !error && participants.length === 0">
              <td colspan="5">등록된 계정이 없습니다.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
    <section
      v-else-if="tab === 'files'"
      class="panel">
      <div class="panel-heading">
        <div>
          <h2><strong>배포 자료</strong></h2>
          <p class="font-medium">Data 페이지에 노출되는 파일과 링크</p>
        </div>
        <button class="primary-button compact">
          <AppIcon name="upload" /> 
          자료 업로드
        </button>
      </div>
      <div
        v-for="r in store.resources"
        :key="r.id"
        class="file-admin-row">
        <span class="file-tile"><AppIcon name="file" /></span>
        <div>
          <b>{{ r.name }}</b>
          <small>{{ r.version }} · {{ r.size }} · {{ r.updatedAt }}</small>
        </div>
        <span class="category-badge">{{ r.category }}</span>
        <button class="table-action">
          수정
        </button>
        <button class="table-action danger">
          삭제
        </button>
      </div>
    </section>
    <section
      v-else
      class="panel">
      <div class="panel-heading">
        <div>
          <h2><strong>채점 대기열</strong></h2>
          <p class="font-medium">채점 서버 상태와 진행률</p>
        </div>
        <span class="server-ok">
          <i></i>
          채점 서버 정상
        </span>
      </div>
      <div
        v-for="s in store.submissions"
        :key="s.id"
        class="queue-row">
        <div>
          <b>#{{ s.id }} · {{ s.policy }}</b>
          <small>{{ s.task }} · {{ s.submittedAt }}</small>
        </div>
        <div class="progress-track">
          <span :style="{ width: `${s.progress}%` }"></span>
        </div>
        <b>{{ s.progress }}%</b>
        <span>{{ s.eta || `점수 ${s.score}` }}</span>
      </div>
    </section>
  </div>
</template>
