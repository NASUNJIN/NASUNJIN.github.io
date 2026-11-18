<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { LeaderboardColumn, MetricValue, RankedResult, TaskLeaderboard } from '../../types/challenge'

const props = defineProps<{ config: TaskLeaderboard; rows: RankedResult[] }>()
const sortKey = ref('score')
const descending = ref(true)
watch(() => props.config, () => { sortKey.value = 'score'; descending.value = true })

function raw(row: RankedResult, key: string): MetricValue {
  if (key === 'score') return row.score
  if (key === 'team') return row.teamName
  return row.metrics[key] ?? null
}
const sortedRows = computed(() => [...props.rows].sort((a, b) => {
  const left = raw(a, sortKey.value)
  const right = raw(b, sortKey.value)
  const comparison = typeof left === 'number' && typeof right === 'number'
    ? left - right : String(left ?? '').localeCompare(String(right ?? ''), 'ko')
  return comparison * (descending.value ? -1 : 1)
}))
function sort(column: LeaderboardColumn) {
  if (column.key === 'team' || column.format === 'status') return
  if (sortKey.value === column.key) descending.value = !descending.value
  else { sortKey.value = column.key; descending.value = true }
}
function display(value: MetricValue, format: LeaderboardColumn['format']) {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value !== 'number') return String(value)
  if (format === 'score') return value.toFixed(value >= 10 ? 1 : 3)
  if (format === 'percent') return `${value}%`
  if (format === 'seconds') return `${value} s`
  if (format === 'megabytes') return `${value} MB`
  if (format === 'number') return Number.isInteger(value) ? String(value) : value.toFixed(3)
  return String(value)
}
</script>

<template>
  <div class="table-shell"><div class="table-scroll"><table class="leader-table">
    <thead><tr><th class="cell-rank">순위</th><th v-for="column in config.columns" :key="column.key" :class="[`cell-${column.format}`, { active: sortKey === column.key, 'cell-team': column.key === 'team' }]" @click="sort(column)">{{ column.label }} <span v-if="sortKey === column.key">{{ descending ? '↓' : '↑' }}</span></th></tr></thead>
    <tbody>
      <tr v-for="row in sortedRows" :key="row.submissionId"><td class="cell-rank">{{ row.rank }}</td><td v-for="column in config.columns" :key="column.key" :class="[`cell-${column.format}`, { 'team-cell': column.key === 'team' }]">
        <template v-if="column.key === 'team'"><span class="team-logo">{{ row.teamName.charAt(0) }}</span><b>{{ row.teamName }}</b></template>
        <span v-else-if="column.format === 'status'" class="status-pill" :class="String(raw(row, column.key) ?? '').replaceAll(' ', '-')">{{ display(raw(row, column.key), column.format) }}</span>
        <template v-else>{{ display(raw(row, column.key), column.format) }}</template>
      </td></tr>
      <tr v-if="config.baseline" class="baseline-row"><td class="cell-rank">참고</td><td v-for="column in config.columns" :key="column.key" :class="{ 'team-cell': column.key === 'team' }"><template v-if="column.key === 'team'"><span class="team-logo baseline">B</span><b>기준 정책</b></template><template v-else>{{ display(config.baseline[column.key] ?? null, column.format) }}</template></td></tr>
      <tr v-if="rows.length === 0"><td :colspan="config.columns.length + 1">아직 반영할 완료 결과가 없습니다.</td></tr>
    </tbody>
  </table></div><div class="table-note"><span>i</span>{{ config.note }}</div></div>
</template>
