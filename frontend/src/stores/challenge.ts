import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import mock from '../data/mock-data.json'
import type { ChallengeMockData } from '../types/challenge'

const data = mock as unknown as ChallengeMockData

export const useChallengeStore = defineStore('challenge', () => {
  const event = ref(data.event)
  const scenarios = ref(data.scenarios)
  const leaderboards = ref(data.leaderboards)
  const resources = ref(data.resources)
  const submissions = ref(data.submissions)
  const users = ref(data.users)

  const activeTasks = computed(() =>
    scenarios.value.flatMap((s) => s.tasks).filter((t) => t.status === 'active'),
  )
  const leaderboardByTask = (taskId: string) => leaderboards.value[taskId]
  const scenarioById = (id: string) => scenarios.value.find((s) => s.id === id)
  const taskById = (id: string) => scenarios.value.flatMap((s) => s.tasks).find((t) => t.id === id)

  return {
    event,
    scenarios,
    leaderboards,
    resources,
    submissions,
    users,
    activeTasks,
    leaderboardByTask,
    scenarioById,
    taskById,
  }
})
