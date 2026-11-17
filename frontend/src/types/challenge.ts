export type UserRole = 'MASTER' | 'ADMIN' | 'USER'
export type UserStatus = 'active' | 'pending' | 'suspended'
export type TaskStatus = 'active' | 'coming-soon'
export type SubmissionType = 'policy' | 'result'
export type SortDirection = 'asc' | 'desc'

export interface AuthUser {
  id: number
  name: string
  email: string
  role: UserRole
  team_name: string | null
}

export interface LoginInput {
  email: string
  password: string
}

export interface ChallengeTask {
  id: string
  name: string
  status: TaskStatus
  submissionType: SubmissionType
  robotCount?: number | null
  duration?: string
  runs?: number
}

export interface Scenario {
  id: string
  name: string
  description: string
  tone: string
  tasks: ChallengeTask[]
}

export type LeaderboardValue = string | number | boolean | null | undefined
export type LeaderboardRow = Record<string, LeaderboardValue> & {
  id: number
  team: string
  officialRank?: number
  isMe?: boolean
}

export interface LeaderboardColumn {
  key: string
  label: string
  type: string
  lowerBetter?: boolean
}

export interface Leaderboard {
  title: string
  description: string
  defaultSort: { key: string; direction: SortDirection }
  columns: LeaderboardColumn[]
  rows: LeaderboardRow[]
  baseline?: Record<string, LeaderboardValue>
  note: string
}

export interface EventSummary {
  name: string
  status: string
  period: string
  teams: number
  submissions: number
  queued: number
  lastUpdated: string
}

export interface ResourceItem {
  id: number
  category: string
  name: string
  description: string
  version: string
  size: string
  updatedAt: string
  url: string
}

export interface SubmissionItem {
  id: number
  task: string
  policy: string
  status: 'queued' | 'scoring' | 'done' | 'failed'
  progress: number
  runs: string
  submittedAt: string
  eta?: string
  score?: number
}

export interface SubmissionRecord {
  id: number
  submitter_id: string
  team_name: string
  scenario_id: string
  task_id: string
  policy_name: string
  method_description: string
  original_filename: string
  file_size: number
  sha256: string
  submitted_at: string
  validation_result: { valid: boolean; warnings: string[]; errors: string[] }
  grading_status: 'STORED' | 'QUEUED' | 'SCORING' | 'COMPLETED' | 'FAILED'
  storage_file_id: string
}

export interface SubmissionTaskOption {
  id: string
  scenarioId: string
  label: string
  kind: 'policy' | 'fire-edit'
}

export interface UserItem {
  id: number
  name: string
  email: string
  role: 'admin' | 'user'
  status: UserStatus
  joinedAt: string
}

export interface ChallengeMockData {
  event: EventSummary
  scenarios: Scenario[]
  leaderboards: Record<string, Leaderboard>
  resources: ResourceItem[]
  submissions: SubmissionItem[]
  users: UserItem[]
}
