<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue'

  export type ValidationStatus = 'error' | 'warning' | 'success'

  const props = defineProps<{
    status: ValidationStatus
    message: string
    details: string[]
    submitting: boolean
  }>()
  const emit = defineEmits<{ confirm: []; close: [] }>()
  const dialog = ref<HTMLDialogElement | null>(null)
  const title = computed(() =>
    props.status === 'success'
      ? '제출할 준비가 끝났어요'
      : props.status === 'warning'
        ? '파일 구성을 확인해 주세요'
        : '파일을 확인할 수 없어요',
  )
  const tone = computed(() => {
    if (props.status === 'success')
      return {
        text: 'text-brand-500',
        halo: 'bg-brand-50',
        bullet: 'bg-brand-500',
        button: 'bg-brand-500 hover:bg-brand-700 focus-visible:ring-brand-500/30',
      }
    if (props.status === 'warning')
      return {
        text: 'text-amber-500',
        halo: 'bg-amber-50',
        bullet: 'bg-amber-500',
        button: 'bg-amber-500 hover:bg-amber-600 focus-visible:ring-amber-500/30',
      }
    return {
      text: 'text-red-500',
      halo: 'bg-red-50',
      bullet: 'bg-red-500',
      button: 'bg-red-500 hover:bg-red-600 focus-visible:ring-red-500/30',
    }
  })

  onMounted(() => dialog.value?.showModal())
  function close() {
    if (!props.submitting) emit('close')
  }
</script>

<template>
  <Teleport to="body">
    <dialog
      ref="dialog"
      class="validation-dialog m-auto max-h-[calc(100dvh-32px)] w-[min(440px,calc(100vw-32px))] max-w-none overflow-visible rounded-3xl border-0 bg-transparent p-0 font-sans text-slate-900 shadow-[0_30px_90px_rgba(15,27,52,0.24),0_8px_28px_rgba(15,27,52,0.12)] max-[520px]:w-[calc(100vw-24px)] max-[520px]:rounded-[22px]"
      aria-labelledby="validation-dialog-title"
      aria-describedby="validation-dialog-description"
      @cancel.prevent="close"
    >
      <div
        class="dialog-surface relative max-h-[calc(100dvh-32px)] overflow-y-auto rounded-3xl border border-white/80 bg-linear-to-b from-white to-slate-50 px-8 pb-7 pt-8.5 max-[520px]:rounded-[22px] max-[520px]:px-5.5 max-[520px]:pb-5.5 max-[520px]:pt-7.5"
      >
        <div
          class="relative mx-auto mb-4.5 mt-0.5 grid size-22 place-items-center"
          :class="tone.text"
        >
          <span
            class="absolute inset-0 rotate-[8deg] rounded-[30px]"
            :class="tone.halo"
          ></span>
          <svg
            class="relative size-16 drop-shadow-[0_4px_8px_rgba(15,23,42,0.12)]"
            viewBox="0 0 64 64"
            fill="none"
            stroke="currentColor"
            stroke-width="4.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <circle
              cx="32"
              cy="32"
              r="25"
            />
            <path
              v-if="status === 'success'"
              d="m19 32 9 9 18-20"
            />
            <template v-else-if="status === 'warning'">
              <path d="M32 18v19" />
              <path d="M32 46h.01" />
            </template>
            <template v-else>
              <path d="m22 22 20 20" />
              <path d="m42 22-20 20" />
            </template>
          </svg>
        </div>

        <div class="flex flex-col gap-2 text-center">
          <h2
            id="validation-dialog-title"
            class="my-0 text-[23px] leading-[1.35] font-extrabold! tracking-[-0.04em] text-slate-900"
          >
            {{ title }}
          </h2>
          <p
            id="validation-dialog-description"
            class="mx-auto max-w-85 text-3.75 leading-[1.65] text-slate-500 break:keep"
          >
            {{ message }}
          </p>
        </div>

        <div
          v-if="details.length"
          class="mt-5.5 rounded-[14px] border border-slate-200 bg-slate-50 px-4.25 py-4"
        >
          <div class="flex items-center gap-2 text-xs font-extrabold text-slate-700">
            <svg
              class="size-4.25 fill-none stroke-current stroke-[1.8]"
              :class="tone.text"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                cx="12"
                cy="12"
                r="9"
              />
              <path d="M12 11v5M12 8h.01" />
            </svg>
            <span>{{ status === 'warning' ? '수정이 필요한 항목' : '검사 상세 내용' }}</span>
          </div>
          <ul class="mt-2.5 list-none space-y-1.5 p-0">
            <li
              v-for="detail in details"
              :key="detail"
              class="relative pl-3.5 text-xs leading-[1.65] text-slate-600"
            >
              <span
                class="absolute top-[0.68em] left-px size-1.25 rounded-full"
                :class="tone.bullet"
              ></span>
              {{ detail }}
            </li>
          </ul>
        </div>

        <p
          v-if="status === 'success'"
          class="m-0 pt-4 text-center text-3.75 leading-[1.55] text-slate-400 break-keep"
        >
          제출하기를 누르면 파일이 최종 저장되고
          <br />
          <b>오늘 제출 횟수에 반영</b>
          됩니다.
        </p>

        <div class="mt-6 grid grid-cols-2 gap-2.5 max-[520px]:grid-cols-1">
          <template v-if="status === 'success'">
            <button
              class="inline-flex min-h-12.5 items-center justify-center rounded-[13px] border border-slate-200 bg-white px-4.5 text-sm font-extrabold! text-slate-950! transition hover:border-slate-300 hover:bg-slate-50 hover:text-black! disabled:cursor-not-allowed disabled:opacity-65 max-[520px]:w-full"
              type="button"
              :disabled="submitting"
              @click="close"
            >
              제출 안 하기
            </button>
            <button
              class="inline-flex min-h-12.5 items-center justify-center gap-2 rounded-[13px] border-0 px-4.5 text-sm font-extrabold! text-white! transition hover:-translate-y-px focus-visible:ring-4 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-65 max-[520px]:row-start-1 max-[520px]:w-full"
              :class="tone.button"
              type="button"
              :disabled="submitting"
              @click="emit('confirm')"
            >
              <span
                v-if="submitting"
                class="spinner size-3.75 rounded-full border-2 border-white/40 border-t-white"
              ></span>
              {{ submitting ? '안전하게 저장 중' : '제출하기' }}
            </button>
          </template>
          <button
            v-else
            class="col-span-full inline-flex min-h-12.5 items-center justify-center rounded-[13px] border-0 px-4.5 text-sm font-extrabold! text-white! transition hover:-translate-y-px focus-visible:ring-4 focus-visible:outline-none max-[520px]:w-full"
            :class="tone.button"
            type="button"
            @click="close"
          >
            파일 다시 선택하기
          </button>
        </div>
      </div>
    </dialog>
  </Teleport>
</template>

<style scoped>
  .validation-dialog::backdrop {
    background: rgba(19, 27, 43, 0.52);
    backdrop-filter: blur(5px);
    animation: backdrop-in 180ms ease-out;
  }
  .dialog-surface {
    animation: dialog-in 220ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  .spinner {
    animation: spin 0.7s linear infinite;
  }
  @keyframes dialog-in {
    from {
      opacity: 0;
      transform: translateY(10px) scale(0.97);
    }
  }
  @keyframes backdrop-in {
    from {
      opacity: 0;
    }
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .dialog-surface,
    .validation-dialog::backdrop,
    .spinner {
      animation: none;
    }
  }
</style>
