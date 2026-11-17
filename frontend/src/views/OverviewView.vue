<script setup lang="ts">
  import { useChallengeStore } from '../stores/challenge'
  import AppIcon from '../components/ui/AppIcon.vue'
  import MetricCard from '../components/overview/MetricCard.vue'
  const store = useChallengeStore()
</script>
<template>
  <div class="page-stack flex flex-col gap-6">
    <section class="hero-panel">
      <div>
        <span class="eyebrow">AGENT CHALLENGE 2026</span>
        <h1><strong>Challenge Overview</strong></h1>
        <p class="font-medium">시나리오를 선택하고 태스크별 리더보드와 제출 현황을 확인하세요.</p>
      </div>
      <div class="event-card">
        <span class="live-dot"></span>
        <div>
          <b>대회 운영 중</b>
          <small>{{ store.event.period }}</small>
        </div>
      </div>
    </section>
    <section class="metrics-grid grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        label="참가 팀"
        :value="store.event.teams"
        hint="승인된 팀"
        tone="blue"
      >
        <AppIcon name="users" class="w-6 h-6" />
      </MetricCard>
      <MetricCard
        label="전체 제출"
        :value="store.event.submissions"
        hint="4개 활성 태스크"
        tone="orange"
      >
        <AppIcon name="upload" class="w-6 h-6" />
      </MetricCard>
      <MetricCard
        label="채점 대기"
        :value="store.event.queued"
        hint="예상 최대 3시간"
        tone="violet"
      >
        <AppIcon name="clock" class="w-6 h-6" />
      </MetricCard>
      <MetricCard
        label="활성 리더보드"
        :value="store.activeTasks.length"
        hint="준비 중 3개"
        tone="green"
      >
        <AppIcon name="trophy" class="w-6 h-6" />
      </MetricCard>
    </section>
    <section class="section-block">
      <div class="section-heading">
        <div>
          <span class="eyebrow">CHALLENGES</span>
          <h2><strong>시나리오별 태스크</strong></h2>
        </div>
        <RouterLink
          class="text-link"
          to="/leaderboard"
        >
          전체 리더보드
          <AppIcon name="arrow" />
        </RouterLink>
      </div>
      <div class="scenario-grid grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <article
          v-for="(scenario, idx) in store.scenarios"
          :key="scenario.id"
          class="scenario-card"
          :class="scenario.tone"
        >
          <div class="scenario-number">0{{ idx + 1 }}</div>
          <span class="scenario-icon">
            <AppIcon
              :name="idx === 0 ? 'grid' : idx === 1 ? 'spark' : 'database'"
              :size="24"
            />
          </span>
          <h3>
            <strong>{{ scenario.name }}</strong>
          </h3>
          <p class="font-medium">{{ scenario.description }}</p>
          <div class="task-list">
            <RouterLink
              v-for="task in scenario.tasks"
              :key="task.id"
              :to="task.status === 'active' ? `/leaderboard/${scenario.id}/${task.id}` : ''"
              :class="{ disabled: task.status !== 'active' }"
            >
              <span class="font-semibold">{{ task.name }}</span>
              <small v-if="task.status !== 'active'">준비 중</small>
              <AppIcon
                v-else
                name="chevron"
              />
            </RouterLink>
          </div>
        </article>
      </div>
    </section>
    <section class="split-section grid gap-5 xl:grid-cols-[1.35fr_1fr]">
      <article class="panel">
        <div class="panel-heading">
          <h3><strong>내 최근 제출</strong></h3>
          <RouterLink to="/submit">전체 보기</RouterLink>
        </div>
        <div class="submission-list">
          <div
            v-for="item in store.submissions"
            :key="item.id"
            class="submission-item"
          >
            <span class="file-tile">
              <AppIcon name="file" />
            </span>
            <div>
              <b>{{ item.policy }}</b>
              <small>{{ item.task }} · {{ item.submittedAt }}</small>
            </div>
            <span
              class="submission-status"
              :class="item.status"
            >
              {{
                item.status === 'done'
                  ? `완료 · ${item.score}`
                  : item.status === 'scoring'
                    ? `채점 중 ${item.runs}`
                    : '대기 중'
              }}
            </span>
          </div>
        </div>
      </article>
      <article class="panel quick-panel">
        <div class="panel-heading">
          <h3><strong>빠른 시작</strong></h3>
        </div>
        <RouterLink to="/data">
          <AppIcon name="download" />
          <span>
            <b>개발 자료 내려받기</b>
            <small>실행 환경, 예제 정책, 공개 시나리오</small>
          </span>
          <AppIcon name="chevron" />
        </RouterLink>
        <RouterLink to="/submit">
          <AppIcon name="upload" />
          <span>
            <b>새 결과물 제출</b>
            <small>정책 코드 또는 Fire Edit 결과</small>
          </span>
          <AppIcon name="chevron" />
        </RouterLink>
      </article>
    </section>
  </div>
</template>
