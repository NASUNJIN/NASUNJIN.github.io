<script setup lang="ts">
import { computed, ref } from 'vue'
import { useChallengeStore } from '../stores/challenge'
import AppIcon from '../components/ui/AppIcon.vue'

const store = useChallengeStore()
const query = ref('')
const normalizedQuery = computed(() => query.value.trim().toLocaleLowerCase('ko'))
const scenarios = computed(() => store.scenarios.map((scenario) => ({
  ...scenario,
  tasks: scenario.tasks.filter((task) =>
    `${scenario.name} ${task.name}`.toLocaleLowerCase('ko').includes(normalizedQuery.value),
  ),
})).filter((scenario) => scenario.tasks.length > 0))
</script>

<template>
  <div class="page-stack flex flex-col gap-6">
    <div class="page-heading">
      <div>
        <span class="eyebrow">PUBLIC DATA</span>
        <h1><strong>Data</strong></h1>
        <p class="font-medium">현재 공개된 시나리오와 태스크 정보를 확인하세요.</p>
      </div>
      <button class="primary-button compact" type="button" :disabled="store.loading" @click="store.load">
        새로고침
      </button>
    </div>
    <section class="panel">
      <h2><strong>정적 공개 데이터</strong></h2>
      <p>
        이 페이지는 서버나 로그인 없이 <code>public/data/tasks.json</code>을 읽어 표시합니다. 
        학습 자료나 참가자 제출 파일 다운로드는 현재 제공하지 않습니다.
      </p>
    </section>
    <div class="toolbar">
      <label class="search-box">
        <AppIcon name="search" />
        <input v-model="query" type="search" placeholder="시나리오 또는 태스크 검색" />
      </label>
      <span>시나리오 {{ store.scenarios.length }}개 · 태스크 {{ store.scenarios.flatMap((item) => item.tasks).length }}개</span>
    </div>
    <p v-if="store.loading" class="panel" role="status">
      데이터를 불러오는 중입니다…
    </p>
    <section v-else-if="store.error" class="panel" role="alert">
      <h2><strong>데이터를 표시할 수 없습니다.</strong></h2>
      <p class="form-error">{{ store.error }}</p>
      <button class="table-action" type="button" @click="store.load">다시 시도</button>
    </section>
    <section v-else-if="scenarios.length" class="resource-grid grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <article v-for="scenario in scenarios" :key="scenario.id" class="resource-card">
        <div class="resource-top">
          <span class="file-tile">
            <AppIcon name="database" />
          </span>
          <span class="category-badge">
            {{ scenario.id }}
          </span>
        </div>
        <h3>{{ scenario.name }}</h3>
        <p>{{ scenario.tasks.length }}개 태스크</p>
        <div class="task-list">
          <RouterLink v-for="task in scenario.tasks" :key="task.id" :to="task.status === 'active' ? `/leaderboard/${scenario.id}/${task.id}` : ''" :class="{ disabled: task.status !== 'active' }">
            <span>
              <b>{{ task.name }}</b>
              <small>{{ task.status === 'active' ? task.id : '준비 중' }}</small>
            </span>
            <AppIcon v-if="task.status === 'active'" name="chevron" />
          </RouterLink>
        </div>
      </article>
    </section>
    <section v-else class="panel">
      <h2><strong>{{ query ? '검색 결과가 없습니다.' : '등록된 과제가 없습니다.' }}</strong></h2>
      <p v-if="!query"><code>public/data/tasks.json</code>에 시나리오와 태스크를 추가해 주세요.</p>
    </section>
  </div>
</template>
