<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import type {
    Leaderboard,
    LeaderboardColumn,
    LeaderboardRow,
    LeaderboardValue,
    SortDirection,
  } from '../../types/challenge'

  const props = defineProps<{ board: Leaderboard }>()
  const sortKey = ref<string>(props.board.defaultSort.key)
  const sortDirection = ref<SortDirection>(props.board.defaultSort.direction)
  watch(
    () => props.board,
    (board) => {
      sortKey.value = board.defaultSort.key
      sortDirection.value = board.defaultSort.direction
    },
  )

  // 정렬 (원본 수정 하지 않고 새 배열 반환)
  const rows = computed(() =>
    [...props.board.rows].sort((a, b) => {
      const av = a[sortKey.value] ?? Infinity
      const bv = b[sortKey.value] ?? Infinity
      // 문자열이면 사전순, 숫자면 크기 비교
      const comparison =
        typeof av === 'string' && typeof bv === 'string'
          ? av.localeCompare(bv)
          : Number(av) - Number(bv)
      // 오름차순이면 그대로, 내림차순이면 부호 반전
      return comparison * (sortDirection.value === 'asc' ? 1 : -1)
    }),
  )

  // 정렬 키와 방향을 바꾸는 함수
  function sort(column: LeaderboardColumn) {
    if (sortKey.value === column.key)
      sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
    else {
      sortKey.value = column.key
      sortDirection.value = column.lowerBetter ? 'asc' : 'desc'
    }
  }

  // 셀 값 포맷팅
  function value(row: LeaderboardRow | Record<string, LeaderboardValue>, col: LeaderboardColumn) {
    const v = row[col.key]
    if (v === undefined || v === null) return '—'
    if (col.type === 'percent' && typeof v === 'number') return `${Math.round(v * 100)}%`
    if (col.type === 'seconds') return `${v} s`
    if (col.type === 'mb' && typeof v === 'number') return `${v.toFixed(v < 1 ? 2 : 1)} MB`
    if (['score', 'number'].includes(col.type) && typeof v === 'number') return v.toFixed(3)
    if (col.type === 'score1' && typeof v === 'number') return v.toFixed(1)
    return v
  }
</script>

<template>
  <div class="table-shell">
    <div class="table-scroll">
      <table class="leader-table">
        <thead>
          <tr>
            <th
              v-for="col in board.columns"
              :key="col.key"
              @click="sort(col)"
              :class="[`cell-${col.type}`, { active: sortKey === col.key }]"
            >
              {{ col.label }}
              <span v-if="sortKey === col.key">
                {{ sortDirection === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          <!-- 로그인한 사용자 행일 경우 하이라이트 -->
          <tr
            v-for="row in rows"
            :key="row.id"
            :class="{ 'my-row': row.isMe }"
          >
            <!-- 셀 내용 -->
            <td
              v-for="col in board.columns"
              :key="col.key"
              :class="[`cell-${col.type}`, { 'team-cell': col.key === 'team' }]"
            >
              <!-- 순위 셀 -->
              <template v-if="col.type === 'rank'">
                <span>
                  {{ row[col.key] }}
                </span>
              </template>

              <!-- 팀 셀 (우리 팀일 경우 YOU 뱃지 부여) -->
              <template v-else-if="col.key === 'team'">
                <span class="team-logo">
                  {{ row.team.charAt(0) }}
                </span>
                <b>{{ row.team }}</b>
                <span
                  v-if="row.isMe"
                  class="you-badge"
                >
                  YOU
                </span>
              </template>

              <!-- 상태 셀 -->
              <template v-else-if="col.type === 'status'">
                <span
                  class="status-pill"
                  :class="String(row[col.key] ?? '').replaceAll(' ', '-')"
                >
                  {{ row[col.key] }}
                </span>
              </template>

              <!-- 기타 셀 -->
              <template v-else>
                {{ value(row, col) }}
              </template>
            </td>
          </tr>
          <tr
            v-if="board.baseline"
            class="baseline-row"
          >
            <td
              v-for="(col, index) in board.columns"
              :key="col.key"
              :class="{ 'team-cell': col.key === 'team' }"
            >
              <template v-if="index === 0">참고</template>
              <template v-else-if="col.key === 'team'">
                <span class="team-logo baseline">B</span>
                <b>기준 정책</b>
              </template>
              <template v-else>{{ value(board.baseline, col) }}</template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="table-note">
      <span>i</span>
      {{ board.note }}
    </div>
  </div>
</template>
