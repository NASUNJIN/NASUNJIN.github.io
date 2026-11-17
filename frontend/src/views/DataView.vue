<script setup lang="ts">
  import { ref } from 'vue'
  import { useChallengeStore } from '../stores/challenge'
  import { useAuthStore } from '../stores/auth'
  import AppIcon from '../components/ui/AppIcon.vue'
  const store = useChallengeStore()
  const auth = useAuthStore()
  const query = ref('')
</script>
<template>
  <div class="page-stack flex flex-col gap-6">
    <div class="page-heading">
      <div>
        <span class="eyebrow">RESOURCES</span>
        <h1><strong>Data</strong></h1>
        <p class="font-medium">학습과 검증에 필요한 공식 자료를 내려받으세요.</p>
      </div>
      <button
        v-if="auth.isAdmin"
        class="primary-button compact">
        <AppIcon name="upload" /> 자료 업로드
      </button>
    </div>
    <div class="toolbar">
      <label class="search-box">
        <AppIcon name="search" />
        <input
          v-model="query"
          placeholder="자료 검색" />
      </label>
        <span>총 {{ store.resources.length }}개</span>
    </div>
    <section class="resource-grid grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="r in store.resources.filter(
          (x) => x.name.includes(query) || x.description.includes(query),
        )"
        :key="r.id"
        class="resource-card">
        <div class="resource-top">
          <span class="file-tile">
            <AppIcon name="database" />
          </span>
          <span class="category-badge">
            {{ r.category }}
          </span>
        </div>
        <h3>{{ r.name }}</h3>
        <p>{{ r.description }}</p>
        <dl>
          <div>
            <dt>버전</dt>
            <dd>{{ r.version }}</dd>
          </div>
          <div>
            <dt>크기</dt>
            <dd>{{ r.size }}</dd>
          </div>
          <div>
            <dt>업데이트</dt>
            <dd>{{ r.updatedAt }}</dd>
          </div>
        </dl>
        <a
          :href="r.url"
          class="secondary-button"
        >
          <AppIcon name="download" /> 내려받기
        </a>
      </article>
    </section>
  </div>
</template>
