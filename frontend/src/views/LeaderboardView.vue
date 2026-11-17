<script setup lang="ts">
  import { computed, watchEffect } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useChallengeStore } from '../stores/challenge'
  import LeaderboardTable from '../components/leaderboard/LeaderboardTable.vue'
  import AppIcon from '../components/ui/AppIcon.vue'

  const store = useChallengeStore()
  const route = useRoute()
  const router = useRouter()

  const routeParam = (value: string | string[] | undefined) =>
    typeof value === 'string' ? value : ''

  // 현재 선택된 시나리오 계산
  const activeScenario = computed(() => 
    store.scenarioById(routeParam(route.params.scenarioId)) ?? store.scenarios[0]!,
  )

  // 현재 선택된 태스크 계산
  const activeTask = computed(() =>
    store.taskById(routeParam(route.params.taskId)) ??
    activeScenario.value.tasks.find((t) => t.status === 'active') ??
    store.activeTasks[0]!,
  )

  // 선택된 시나리오와 태스크로 리더보드 계산
  const board = computed(() => store.leaderboardByTask(activeTask.value?.id))

  // 시나리오나 태스크가 선택되지 않았으면 기본값으로 리다이렉트
  watchEffect(() => {
    if (!route.params.scenarioId || !route.params.taskId)
      router.replace(`/leaderboard/${activeScenario.value.id}/${activeTask.value.id}`)
  })

  function selectScenario(id: string) {
    const s = store.scenarioById(id)
    const first = s?.tasks.find((t) => t.status === 'active')
    if (first) router.push(`/leaderboard/${id}/${first.id}`)
  }
</script>

<template>
  <div class="page-stack flex flex-col gap-6">
    <div class="page-heading">
      <div>
        <span class="eyebrow">RANKINGS</span>
        <h1><strong>Leader board</strong></h1>
        <p class="font-medium">공식 순위와 태스크별 세부 지표를 확인하세요.</p>
      </div>
      <RouterLink
        class="primary-button compact"
        to="/submit">
        <AppIcon name="upload" /> 결과물 제출
      </RouterLink>
    </div>

    <!-- 시나리오 분류 탭 -->
    <section class="leader-tabs" aria-label="리더보드 분류">
      <div class="scenario-tabs" role="tablist" aria-label="시나리오 선택">
        <button
          v-for="scenario in store.scenarios"
          :key="scenario.id"
          type="button"
          role="tab"
          :aria-selected="scenario.id === activeScenario.id"
          :aria-controls="`scenario-panel-${scenario.id}`"
          :disabled="!scenario.tasks.some((t) => t.status === 'active')"
          :class="{
            active: scenario.id === activeScenario.id,
            disabled: !scenario.tasks.some((t) => t.status === 'active'),
          }"
          @click="selectScenario(scenario.id)">
          {{ scenario.name
          }}<small v-if="!scenario.tasks.some((t) => t.status === 'active')">준비 중</small>
        </button>
      </div>

      <!-- 세부 태스크 분류 -->
      <div
        :id="`scenario-panel-${activeScenario.id}`"
        class="task-segment-section"
        role="tabpanel">
        <div class="task-segments" aria-label="세부 종목 선택">
        <RouterLink
          v-for="task in activeScenario.tasks"
          :key="task.id"
          :to="
            task.status === 'active'
              ? `/leaderboard/${activeScenario.id}/${task.id}`
              : route.fullPath
          "
          :aria-current="task.id === activeTask.id ? 'page' : undefined"
          :aria-disabled="task.status !== 'active'"
          :class="{ disabled: task.status !== 'active' }"
          >{{ task.name }}<small v-if="task.status !== 'active'">준비 중</small></RouterLink
        >
        </div>
      </div>
    </section>

    <!-- 순위표 영역 -->
    <section
      v-if="board"
      class="board-section">
      <div class="board-heading">
        <div>
          <div class="breadcrumb">
            Leaderboard
            <AppIcon
              name="chevron"
              :size="13" />
            {{ activeScenario.name }}
            <AppIcon
              name="chevron"
              :size="13" />
            {{ activeTask.name }}
          </div>
          <h2><strong>{{ board.title }}</strong></h2>
          <p class="font-medium">{{ board.description }}</p>
        </div>
        <div class="board-meta">
          <span>
            <i class="live-dot"></i>
            {{ board.rows.length }} teams
          </span>
          <span>업데이트 14:32</span>
        </div>
      </div>
      <LeaderboardTable :board="board" />
    </section>
  </div>
</template>
