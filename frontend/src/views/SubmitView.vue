<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue'
  import AppIcon from '../components/ui/AppIcon.vue'
  import SubmissionValidationModal from '../components/submission/SubmissionValidationModal.vue'
  import { apiRequest, downloadSubmission } from '../services/api'
  import { useAuthStore } from '../stores/auth'
  import type { SubmissionRecord, SubmissionTaskOption } from '../types/challenge'

  interface Overview {
    submissions: SubmissionRecord[]
    submissionCountsToday: Record<string, number>
    canSubmit: boolean
    userDailyLimit: number
    maxUploadBytes: number
    tasks: SubmissionTaskOption[]
    disabledTasks: SubmissionTaskOption[]
  }
  interface ValidationModal {
    status: 'error' | 'warning' | 'success'
    message: string
    details: string[]
    confirmationToken?: string
  }

  const auth = useAuthStore()
  const overview = ref<Overview | null>(null)
  const selected = ref('')
  const file = ref<File | null>(null)
  const policy = ref('')
  const description = ref('')
  const agreed = ref(false)
  const loading = ref(true)
  const submitting = ref(false)
  const error = ref('')
  const success = ref('')
  const modal = ref<ValidationModal | null>(null)
  const fileInput = ref<HTMLInputElement | null>(null)

  const task = computed(() => overview.value?.tasks.find((item) => item.id === selected.value))
  const countKey = computed(() => (task.value ? `${task.value.scenarioId}:${task.value.id}` : ''))
  const todayCount = computed(() => overview.value?.submissionCountsToday[countKey.value] || 0)
  const isUnlimited = computed(() => ['ADMIN', 'MASTER'].includes(auth.user?.role || ''))
  const dailyLimit = computed(() => overview.value?.userDailyLimit || 1)
  const limitReached = computed(() => !isUnlimited.value && todayCount.value >= dailyLimit.value)
  const canCheck = computed(() =>
    Boolean(
      overview.value?.canSubmit &&
      !limitReached.value &&
      file.value &&
      policy.value.trim() &&
      description.value.trim() &&
      agreed.value &&
      !submitting.value,
    ),
  )
  const formatBytes = (bytes: number) =>
    bytes >= 1024 ** 2 ? `${Math.round(bytes / 1024 ** 2)} MB` : `${Math.round(bytes / 1024)} KB`
  const formatDate = (value: string) =>
    new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value))
  const taskLabel = (item: SubmissionRecord) =>
    overview.value?.tasks.find(
      (option) => option.id === item.task_id && option.scenarioId === item.scenario_id,
    )?.label || `${item.scenario_id} · ${item.task_id}`
  const statusLabel = (status: SubmissionRecord['grading_status']) =>
    ({
      STORED: '저장 완료',
      QUEUED: '채점 대기',
      SCORING: '채점 중',
      COMPLETED: '채점 완료',
      FAILED: '채점 실패',
    })[status]
  const statusDotClass = (status: SubmissionRecord['grading_status']) => {
    if (status === 'COMPLETED') return 'bg-emerald-500'
    if (['QUEUED', 'SCORING'].includes(status)) return 'bg-amber-500'
    if (status === 'FAILED') return 'bg-red-500'
    return 'bg-slate-400'
  }

  function pick(event: Event) {
    file.value = (event.target as HTMLInputElement).files?.[0] ?? null
    error.value = ''
  }
  function resetFile() {
    file.value = null
    if (fileInput.value) fileInput.value.value = ''
  }
  async function load() {
    loading.value = true
    try {
      overview.value = await apiRequest<Overview>('/submissions')
      if (!selected.value) selected.value = overview.value.tasks[0]?.id || ''
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : '제출 정보를 불러오지 못했습니다.'
    } finally {
      loading.value = false
    }
  }
  async function validateFile() {
    if (!canCheck.value || !file.value) return
    submitting.value = true
    error.value = ''
    success.value = ''
    try {
      const body = new FormData()
      body.append('task_id', selected.value)
      body.append('policy_name', policy.value.trim())
      body.append('method_description', description.value.trim())
      body.append('file', file.value)
      const result = await apiRequest<{
        status: ValidationModal['status']
        message: string
        validation?: { errors?: string[]; warnings?: string[] }
        confirmationToken?: string
      }>('/submissions/validate', { method: 'POST', body })
      modal.value = {
        status: result.status,
        message: result.message,
        details:
          result.status === 'warning'
            ? result.validation?.warnings || []
            : result.validation?.errors || [],
        confirmationToken: result.confirmationToken,
      }
    } catch (cause) {
      modal.value = {
        status: 'error',
        message: cause instanceof Error ? cause.message : '파일 검사에 실패했습니다.',
        details: [],
      }
    } finally {
      submitting.value = false
    }
  }
  async function confirmSubmission() {
    if (!modal.value?.confirmationToken) return
    submitting.value = true
    try {
      const result = await apiRequest<{ submission: SubmissionRecord }>('/submissions/confirm', {
        method: 'POST',
        body: JSON.stringify({ confirmationToken: modal.value.confirmationToken }),
      })
      success.value = `제출 #${result.submission.id}이 안전하게 저장되었습니다.`
      modal.value = null
      resetFile()
      policy.value = ''
      description.value = ''
      agreed.value = false
      await load()
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : '제출에 실패했습니다.'
      modal.value = null
    } finally {
      submitting.value = false
    }
  }
  async function closeModal() {
    const token = modal.value?.confirmationToken
    modal.value = null
    if (token)
      await apiRequest('/submissions/discard', {
        method: 'POST',
        body: JSON.stringify({ confirmationToken: token }),
      }).catch(() => {})
    resetFile()
  }
  async function download(item: SubmissionRecord) {
    try {
      await downloadSubmission(item.id, item.original_filename)
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : '다운로드에 실패했습니다.'
    }
  }
  onMounted(load)
</script>

<template>
  <div class="flex flex-col gap-3.75 font-sans">
    <header>
      <span class="text-xs font-extrabold! tracking-[0.17em] text-brand-500">SUBMISSION</span>
      <h1 class="my-1 text-[30px] leading-tight font-extrabold! tracking-[-0.04em] text-slate-900">
        결과물 제출
      </h1>
      <p class="m-0 text-sm font-medium text-slate-500">
        파일 검사 후 최종 제출 여부를 선택할 수 있습니다.
      </p>
    </header>

    <p
      v-if="error"
      class="m-0 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-xs font-bold text-red-700"
    >
      {{ error }}
    </p>
    <p
      v-if="success"
      class="m-0 rounded-lg border border-blue-200 bg-brand-50 px-3.5 py-3 text-xs font-bold text-brand-700"
    >
      {{ success }}
    </p>
    <div
      v-if="loading"
      class="grid min-h-55 place-items-center rounded-[14px] border border-slate-200 bg-white p-5 text-xs text-slate-500"
    >
      제출 정보를 불러오는 중입니다.
    </div>

    <section
      v-else
      class="grid items-start gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(300px,0.75fr)]"
    >
      <form
        class="flex flex-col gap-3.25 rounded-[14px] border border-slate-200 bg-white px-5 py-5 shadow-[0_8px_30px_rgba(23,36,66,0.07)] sm:px-6"
        @submit.prevent="validateFile"
      >
        <div class="mt-px flex items-center gap-3">
          <span
            class="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-3.25 font-extrabold text-brand-500"
          >
            1
          </span>
          <h3 class="m-0 text-base font-extrabold! text-slate-900">
            시나리오 · 태스크 선택
          </h3>
        </div>
        <div class="relative">
          <select
            v-model="selected"
            class="h-11.5 w-full cursor-pointer appearance-none rounded-[9px] border border-[#cbd7ec] bg-white py-0 pr-11 pl-3.5
             font-sans text-xs font-bold text-slate-800 outline-none transition focus:border-brand-500  hover:border-brand-500 "
          >
            <option
              v-for="item in overview?.tasks"
              :key="item.id"
              :value="item.id"
            >
              {{ item.label }}
            </option>
            <option
              v-for="item in overview?.disabledTasks"
              :key="item.id"
              disabled
            >
              {{ item.label }} · 준비 중
            </option>
          </select>
          <AppIcon
            name="chevron"
            :size="17"
            class="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 rotate-90 text-slate-500"
          />
        </div>
        <p
          v-if="limitReached"
          class="m-0 rounded-1.75 bg-amber-50 px-3 py-2.5 text-[10px] font-bold text-amber-700"
        >
          오늘 {{ todayCount }}/{{ dailyLimit }}회로 제출 한도를 모두 사용했습니다.
        </p>
        <p
          v-else-if="isUnlimited"
          class="m-0 rounded-1.75 bg-emerald-50 px-3 py-2.5 text-[10px] font-bold text-emerald-700"
        >
          MASTER · ADMIN 은 제출 횟수 제한이 없습니다. 오늘 {{ todayCount }}회 제출했습니다.
        </p>
        <p
          v-else
          class="m-0 rounded-1.75 bg-emerald-50 px-3 py-2.5 text-[10px] font-bold text-emerald-700"
        >
          오늘 {{ todayCount }}/{{ dailyLimit }}회 사용 · {{ dailyLimit - todayCount }}회 남음
        </p>

        <div class="mt-px flex items-center gap-3">
          <span
            class="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-3.25 font-extrabold text-brand-500"
          >
            2
          </span>
          <div>
            <h3 class="m-0 text-base font-extrabold! text-slate-900">
              정책 ZIP 선택
            </h3>
            <p class="mt-0.5 mb-0 text-[10px] font-bold text-red-500">
              .zip 폴더에 policy, training 폴더와 README 파일이 필요합니다.
            </p>
          </div>
        </div>
        <label
          class="flex min-h-30 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-[1.5px] border-dashed
           border-slate-300 bg-slate-50 text-brand-500 transition hover:border-brand-500 hover:bg-brand-50/40"
          :class="file ? 'border-solid border-blue-200 bg-brand-50/70' : ''"
        >
          <input
            ref="fileInput"
            type="file"
            class="hidden"
            @change="pick"
          />
          <AppIcon
            :name="file ? 'file' : 'upload'"
            :size="30"
          />
          <b
            class="max-w-[85%] overflow-hidden text-ellipsis whitespace-nowrap text-xs text-slate-900"
          >
            {{ file?.name || '.zip 파일을 선택하세요' }}
          </b>
          <small class="text-[9px] text-slate-500">
            {{
              file
                ? `${formatBytes(file.size)} · 다시 누르면 파일을 변경할 수 있습니다.`
                : `최대 ${formatBytes(overview?.maxUploadBytes || 0)}`
            }}
          </small>
        </label>

        <div class="mt-px flex items-center gap-3">
          <span
            class="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-3.25 font-extrabold text-brand-500"
          >
            3
          </span>
          <h3 class="m-0 text-base font-extrabold! text-slate-900">
            제출 정보
          </h3>
        </div>
        <div class="grid items-start gap-3.5 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <label class="flex min-w-0 flex-col gap-1.75 text-[11px] font-bold text-slate-800">
            정책 이름
            <input
              v-model="policy"
              maxlength="120"
              required
              class="h-10.5 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs whitespace-nowrap
               text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-brand-500"
              placeholder="예: ppo-lite-v2"
            />
          </label>
          <label class="flex min-w-0 flex-col gap-1.75 text-[11px] font-bold text-slate-800">
            방법 설명
            <textarea
              v-model="description"
              maxlength="5000"
              rows="3"
              required
              class="min-h-19 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs
               text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-brand-500"
              placeholder="사용한 알고리즘과 학습 환경을 간단히 설명하세요."
            ></textarea>
          </label>
        </div>
        <label
          class="flex cursor-pointer items-center gap-2 text-[11px] font-medium text-slate-500"
        >
          <input
            v-model="agreed"
            required
            type="checkbox"
            class="peer sr-only"
          />
          <span
            class="grid size-3.75 shrink-0 place-items-center rounded-[3px] border-[1.5px] border-slate-300 bg-white text-transparent transition
             peer-checked:border-brand-500 peer-checked:bg-brand-500 peer-checked:text-white peer-focus-visible:ring-3 peer-focus-visible:ring-brand-500/20"
          >
            <AppIcon
              name="check"
              :size="11"
            />
          </span>
          제출 규격과 금지 사항을 확인했습니다.
        </label>
        <button
          class="inline-flex min-h-11.5 items-center justify-center rounded-[9px] border-0 bg-brand-500 px-4.5 font-sans font-extrabold! text-white!
           shadow-[0_6px_14px_rgba(41,91,214,0.18)] transition hover:-translate-y-px hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none"
          type="submit"
          :disabled="!canCheck"
        >
          {{ submitting ? '파일 검사 중…' : '파일 검사하기' }}
        </button>
        <small class="text-center text-[11px] font-medium text-slate-400">
          검사 단계에서는 제출 횟수가 차감되지 않습니다.
        </small>
      </form>

      <aside
        class="grid items-start gap-3.5 md:grid-cols-2 lg:sticky lg:top-21 lg:flex lg:flex-col lg:items-stretch"
      >
        <div
          class="w-full rounded-[14px] border
           border-slate-200 bg-white px-5 py-4.5 shadow-[0_8px_30px_rgba(23,36,66,0.07)]"
        >
          <div class="mb-2.5 flex items-start justify-between gap-3">
            <h3 class="mt-1 mb-0 text-base font-extrabold! text-slate-900">
              제출 전 확인
            </h3>
            <span class="grid size-9 place-items-center rounded-[10px] bg-brand-50 text-brand-500">
              <AppIcon
                name="check"
                :size="18"
              />
            </span>
          </div>
          <ul class="m-0 list-none p-0 font-medium">
            <li class="flex items-center gap-2 border-t border-slate-100 py-2.5 text-xs">
              <AppIcon
                name="check"
                class="text-emerald-600"
              />
              정책 클래스 이름이 policy 폴더의 파일과 맞음
            </li>
            <li class="flex items-center gap-2 border-t border-slate-100 py-2.5 text-xs">
              <AppIcon
                name="check"
                class="text-emerald-600"
              />
              가중치는 정책 파일 기준 상대 경로로 읽음
            </li>
            <li class="flex items-center gap-2 border-t border-slate-100 py-2.5 text-xs">
              <AppIcon
                name="check"
                class="text-emerald-600"
              />
              파일 열기, 네트워크, 다른 프로세스를 쓰지 않음
            </li>
            <li class="flex items-center gap-2 border-t border-slate-100 py-2.5 text-xs">
              <AppIcon
                name="check"
                class="text-emerald-600"
              />
              training 폴더에 코드, 설정, 씨앗, 기록이 있음
            </li>
          </ul>
        </div>

        <div
          class="w-full rounded-[14px] border border-slate-200 bg-white px-5 py-4.5 shadow-[0_8px_30px_rgba(23,36,66,0.07)]"
        >
          <div class="mb-2.5 flex items-start justify-between gap-3">
            <h3 class="mt-1 mb-0 text-base font-extrabold! text-slate-900">
              제출 내역
            </h3>
            <span
              class="grid size-9 min-w-9 place-items-center rounded-lg bg-brand-50 text-xs font-extrabold text-brand-500"
            >
              {{ overview?.submissions.length || 0 }}
            </span>
          </div>
          <p class="mt-0 mb-2.5 text-xs text-slate-500">
            {{
              auth.user?.role === 'USER'
                ? '현재 팀 계정의 최근 제출입니다.'
                : '모든 팀의 최근 제출입니다.'
            }}
          </p>
          <div
            v-if="!overview?.submissions.length"
            class="flex min-h-35 flex-col items-center justify-center gap-2 border-t border-slate-200 text-slate-400"
          >
            <AppIcon
              name="file"
              :size="23"
            />
            <b class="text-xs text-slate-500">아직 제출 내역이 없습니다.</b>
          </div>
          <div
            v-else
            class="max-h-71.25 overflow-y-auto"
          >
            <div
              v-for="item in overview?.submissions"
              :key="item.id"
              class="flex items-center gap-2.5 border-t border-slate-200 py-2.5"
            >
              <span
                class="size-1.75 shrink-0 rounded-full"
                :class="statusDotClass(item.grading_status)"
              ></span>
              <div class="flex min-w-0 flex-1 flex-col">
                <b class="overflow-hidden text-xs text-ellipsis whitespace-nowrap text-slate-800">
                  {{ item.team_name }} · {{ item.policy_name }}
                </b>
                <small
                  class="mt-1 overflow-hidden text-[10px] text-ellipsis whitespace-nowrap text-slate-500"
                >
                  {{ taskLabel(item) }} · {{ formatDate(item.submitted_at) }}
                </small>
              </div>
              <div class="flex shrink-0 flex-col items-end gap-1.5">
                <em class="text-[9px] font-normal not-italic text-slate-500">
                  {{ statusLabel(item.grading_status) }}
                </em>
                <button
                  type="button"
                  title="파일 다운로드"
                  class="grid size-6.75 cursor-pointer place-items-center rounded-1.75 border border-slate-200 bg-white p-0
                   text-slate-500 transition hover:border-blue-200 hover:bg-brand-50 hover:text-brand-500"
                  @click="download(item)"
                >
                  <AppIcon
                    name="download"
                    :size="14"
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </section>

    <SubmissionValidationModal
      v-if="modal"
      :status="modal.status"
      :message="modal.message"
      :details="modal.details"
      :submitting="submitting"
      @confirm="confirmSubmission"
      @close="closeModal"
    />
  </div>
</template>
