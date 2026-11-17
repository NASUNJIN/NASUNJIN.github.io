# Agent Challenge 2026 — Phase 1

PPT 요구사항을 UI-First 방식으로 옮긴 Vue 3 + TypeScript 프론트엔드 프로토타입입니다. 현재 단계에서는 API와 DB 없이 `src/data/mock-data.json`을 Pinia 스토어에 로드합니다. 스타일 시스템은 Tailwind CSS v4와 프로젝트 전용 컴포넌트 스타일을 사용합니다.

## 실행

```bash
npm install
npm run dev
```

타입 검사와 프로덕션 빌드:

```bash
npm run typecheck
npm run build
```

Tailwind는 `@tailwindcss/vite` 플러그인으로 연결되어 있으며 디자인 토큰은 `src/styles/main.css`의 `@theme`에서 관리합니다. 화면에서는 Tailwind 유틸리티와 의미 기반 컴포넌트 클래스를 함께 사용합니다.

브라우저에서 Vite가 표시한 주소로 접속합니다. 로그인 화면에서 `참가자` 또는 `운영자` 역할을 고르면 각 역할의 메뉴를 확인할 수 있습니다. 입력된 계정 정보는 Phase 1 데모용이며 서버로 전송되지 않습니다.

## 라우팅 구조

| 경로                               | 화면                       | 권한   |
| ---------------------------------- | -------------------------- | ------ |
| `/login`                           | 로그인                     | 비회원 |
| `/register`                        | 회원가입                   | 비회원 |
| `/overview`                        | 대회 전체 요약             | 로그인 |
| `/leaderboard/:scenarioId/:taskId` | 시나리오/태스크별 리더보드 | 로그인 |
| `/data`                            | 공식 자료 목록과 다운로드  | 로그인 |
| `/submit`                          | ZIP 결과물 제출            | 로그인 |
| `/admin`                           | 유저·파일·채점 대기열 관리 | 운영자 |

## 컴포넌트 트리

```text
App
├─ AuthPanel
│  ├─ LoginView
│  └─ RegisterView
└─ AppShell
   ├─ OverviewView
   │  └─ MetricCard
   ├─ LeaderboardView
   │  └─ LeaderboardTable
   ├─ DataView
   ├─ SubmitView
   └─ AdminView
```

## Mock Data 설계

- `event`: 행사 상태와 전체 KPI
- `scenarios[].tasks[]`: 메뉴/탭을 만드는 설정 데이터. `status`로 활성/준비 중을 제어
- `leaderboards[taskId]`: 태스크별 열 정의, 행, 기준 정책, 점수식 안내
- `resources`: Data 화면 자료
- `submissions`: 사용자 제출 및 채점 진행 상태
- `users`: 운영자 유저 관리 목록

공통 도메인 타입은 `src/types/challenge.ts`에서 관리합니다. Vue 컴포넌트는 모두 `<script setup lang="ts">`를 사용합니다.

리더보드의 `columns` 배열이 화면 열과 정렬 방식을 결정합니다. 새 태스크를 추가할 때 `scenarios`와 `leaderboards`에 설정만 추가하도록 구성했습니다.

## Phase 1 범위

- 로그인/회원가입과 역할별 라우트 가드
- Overview, 활성 리더보드 4종, Data, Submit, Admin UI
- 정렬 가능한 동적 리더보드 표
- ZIP 파일 선택과 제출 완료 상태 시뮬레이션
- 반응형 레이아웃

실제 인증, 파일 저장, 업로드/다운로드, 채점 서버 연동은 Phase 2 이후 API 설계와 함께 연결합니다.
