export interface Team {
  teamId: string
  teamName: string
}

export interface StaticTask {
  id: string
  name: string
  status: 'active' | 'coming-soon'
  leaderboard: TaskLeaderboard
}

export type MetricValue = string | number | boolean | null

export interface LeaderboardColumn {
  key: string
  label: string
  format: 'number' | 'score' | 'percent' | 'seconds' | 'megabytes' | 'status' | 'text'
}

export interface TaskLeaderboard {
  title: string
  description: string
  note: string
  columns: LeaderboardColumn[]
  baseline?: Record<string, MetricValue>
}

export interface StaticScenario {
  id: string
  name: string
  description: string
  tone: 'blue' | 'orange' | 'violet'
  tasks: StaticTask[]
}

export type ResultStatus = 'COMPLETED' | 'FAILED' | 'PENDING'

export interface LeaderboardResult {
  submissionId: string
  teamId: string
  scenarioId: string
  taskId: string
  score: number
  status: ResultStatus
  submittedAt?: string
  gradedAt?: string
  metrics: Record<string, MetricValue>
}

export interface RankedResult extends LeaderboardResult {
  rank: number
  teamName: string
}
