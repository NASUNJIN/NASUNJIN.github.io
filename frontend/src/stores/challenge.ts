import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { 
  AttemptResult, LeaderboardColumn, LeaderboardResult, 
  MetricValue, RankedResult, StaticScenario, TaskLeaderboard, 
  Team, TeamAttempts 
} from '../types/challenge'

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
const isText = (value: unknown): value is string => 
  typeof value === 'string' && value.trim().length > 0
const isDate = (value: unknown) => 
  value === undefined || (isText(value) && !Number.isNaN(Date.parse(value)))
const isMetric = (value: unknown): value is MetricValue =>
  value === null || ['string', 'number', 'boolean'].includes(typeof value)
const columnFormats = ['number', 'score', 'percent', 'seconds', 'megabytes', 'status', 'text']

function parseLeaderboard(value: unknown, scenarioName: string, taskName: string): TaskLeaderboard {
  const config = isObject(value) ? value : {}
  const columns = Array.isArray(config.columns) ? config.columns.filter((column): column is LeaderboardColumn =>
    isObject(column) && isText(column.key) && isText(column.label) && columnFormats.includes(String(column.format)),
  ) : []
  const baseline = isObject(config.baseline)
    ? Object.fromEntries(Object.entries(config.baseline).filter((entry): entry is [string, MetricValue] => isMetric(entry[1]))) : undefined
  return {
    title: isText(config.title) ? config.title : `${scenarioName} ${taskName}`,
    description: isText(config.description) ? config.description : '팀별 최고 점수 순위입니다.',
    note: isText(config.note) ? config.note : 'COMPLETED 결과 중 팀별 최고 점수만 반영합니다.',
    columns,
    ...(baseline ? { baseline } : {}),
  }
}

export const useChallengeStore = defineStore('challenge', () => {
  const teams = ref<Team[]>([])
  const scenarios = ref<StaticScenario[]>([])
  const results = ref<LeaderboardResult[]>([])
  const attempts = ref<AttemptResult[]>([])
  const updatedAt = ref<string | null>(null)
  const loading = ref(false)
  const error = ref('')
  const warnings = ref<string[]>([])

  async function readJson(path: string) {
    const response = await fetch(`${import.meta.env.BASE_URL}data/${path}?v=${Date.now()}`, { cache: 'no-cache' })
    if (!response.ok) 
      throw new Error(`${path} 요청 실패 (${response.status})`)
    return response.json() as Promise<unknown>
  }

  async function load() {
    loading.value = true
    error.value = ''
    warnings.value = []
    try {
      const [teamData, taskData, boardData, attemptData] = await Promise.all([
        readJson('teams.json'), readJson('tasks.json'), readJson('leaderboard.json'), readJson('attempts.json'),
      ])
      if (!isObject(teamData) || !Array.isArray(teamData.teams)) 
        throw new Error('teams.json 구조가 올바르지 않습니다.')
      if (!isObject(taskData) || !Array.isArray(taskData.scenarios)) 
        throw new Error('tasks.json 구조가 올바르지 않습니다.')
      if (!isObject(boardData) || !Array.isArray(boardData.results)) 
        throw new Error('leaderboard.json 구조가 올바르지 않습니다.')
      if (!isObject(attemptData) || !Array.isArray(attemptData.attempts))
        throw new Error('attempts.json 구조가 올바르지 않습니다.')

      teams.value = teamData.teams.filter((item): item is Team =>
        isObject(item) && isText(item.teamId) && isText(item.teamName),
      )
      scenarios.value = taskData.scenarios
        .filter((item) => isObject(item) && isText(item.id) && isText(item.name) && Array.isArray(item.tasks))
        .map((item) => ({
          id: item.id as string,
          name: item.name as string,
          description: isText(item.description) ? item.description : '',
          tone: ['blue', 'orange', 'violet'].includes(String(item.tone))
            ? item.tone as StaticScenario['tone'] : 'blue',
          tasks: (item.tasks as unknown[]).filter((task) => isObject(task) && isText(task.id) && isText(task.name))
            .map((task) => ({
              id: (task as Record<string, unknown>).id as string,
              name: (task as Record<string, unknown>).name as string,
              status: (task as Record<string, unknown>).status === 'coming-soon' ? 'coming-soon' as const : 'active' as const,
              ...(isObject((task as Record<string, unknown>).download) &&
                isText(((task as Record<string, unknown>).download as Record<string, unknown>).asset)
                ? { download: { asset: ((task as Record<string, unknown>).download as Record<string, unknown>).asset as string } }
                : {}),
              leaderboard: parseLeaderboard((task as Record<string, unknown>).leaderboard, item.name as string, (task as Record<string, unknown>).name as string),
            })),
        }))

      const teamIds = new Set(teams.value.map((team) => team.teamId))
      const taskRefs = new Set(scenarios.value.flatMap((scenario) => scenario.tasks.map((task) => `${scenario.id}/${task.id}`)))
      
      results.value = boardData.results.filter((item, index): item is LeaderboardResult => {
        const valid = isObject(item) && isText(item.submissionId) && isText(item.teamId) &&
          isText(item.scenarioId) && isText(item.taskId) && typeof item.score === 'number' &&
          Number.isFinite(item.score) && ['COMPLETED', 'FAILED', 'PENDING'].includes(String(item.status)) &&
          isDate(item.submittedAt) && isDate(item.gradedAt) && (!('metrics' in item) || isObject(item.metrics)) && teamIds.has(item.teamId) &&
          taskRefs.has(`${item.scenarioId}/${item.taskId}`)
        if (!valid) warnings.value.push(`결과 ${index + 1}번은 값 또는 참조가 잘못되어 제외했습니다.`)
        if (valid) item.metrics = isObject(item.metrics)
          ? Object.fromEntries(Object.entries(item.metrics).filter(([, value]) => isMetric(value))) : {}
        return valid
      })

      attempts.value = attemptData.attempts.filter((item, index): item is AttemptResult => {
        const nullableNumber = (value: unknown) => value === null || (typeof value === 'number' && Number.isFinite(value))
        const valid = isObject(item) && isText(item.attemptId) && isText(item.teamId) &&
          isText(item.scenarioId) && isText(item.taskId) && Number.isInteger(item.round) && Number(item.round) > 0 &&
          typeof item.completed === 'boolean' && isDate(item.submittedAt) && nullableNumber(item.explorationRate) &&
          nullableNumber(item.consistencyRate) && nullableNumber(item.contacts) && nullableNumber(item.taskScore) &&
          nullableNumber(item.communicationSavings) && nullableNumber(item.finalScore) && isText(item.measurementStatus) &&
          teamIds.has(item.teamId) && taskRefs.has(`${item.scenarioId}/${item.taskId}`)
        if (!valid) warnings.value.push(`응시 결과 ${index + 1}번은 값 또는 참조가 잘못되어 제외했습니다.`)
        return valid
      })
      
      updatedAt.value = boardData.updatedAt === null || isDate(boardData.updatedAt)
        ? boardData.updatedAt as string | null : null
      if (boardData.updatedAt !== null && updatedAt.value === null) 
        warnings.value.push('updatedAt 날짜가 잘못되어 표시하지 않습니다.')
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : '데이터를 불러오지 못했습니다.'
    } finally { loading.value = false }
  }

  const teamName = (id: string) => 
    teams.value.find((team) => team.teamId === id)?.teamName ?? `알 수 없는 팀 (${id})`
  const scenarioById = (id: string) => 
    scenarios.value.find((scenario) => scenario.id === id)
  const taskById = (id: string) => 
    scenarios.value.flatMap((scenario) => scenario.tasks).find((task) => task.id === id)

  function ranked(scenarioId: string, taskId: string): RankedResult[] {
    const best = new Map<string, LeaderboardResult>()
    results.value.filter((result) => 
      result.status === 'COMPLETED' && result.scenarioId === scenarioId && result.taskId === taskId)
      .forEach((result) => { 
        if (!best.has(result.teamId) || result.score > best.get(result.teamId)!.score) 
          best.set(result.teamId, result) 
      })

    let previousScore: number | undefined
    let rank = 0
    return [...best.values()].sort((a, b) => b.score - a.score || teamName(a.teamId).localeCompare(teamName(b.teamId), 'ko'))
      .map((result, index) => {
        if (result.score !== previousScore) rank = index + 1
        previousScore = result.score
        return { ...result, rank, teamName: teamName(result.teamId) }
      })
  }
  function attemptsByTask(scenarioId: string, taskId: string): TeamAttempts[] {
    const grouped = new Map<string, AttemptResult[]>()
    attempts.value.filter((attempt) => attempt.scenarioId === scenarioId && attempt.taskId === taskId)
      .forEach((attempt) => grouped.set(attempt.teamId, [...(grouped.get(attempt.teamId) ?? []), attempt]))
    return [...grouped.entries()].map(([teamId, teamAttempts]) => ({
      teamId,
      teamName: teamName(teamId),
      attempts: teamAttempts.sort((a, b) => a.round - b.round),
    })).sort((a, b) => a.teamName.localeCompare(b.teamName, 'ko'))
  }
  const completedCount = computed(() => 
    results.value.filter((result) => result.status === 'COMPLETED').length
  )
  return { 
    teams, scenarios, results, attempts, updatedAt, 
    loading, error, warnings, 
    load, ranked, attemptsByTask, scenarioById, taskById, 
    completedCount 
  }
})
