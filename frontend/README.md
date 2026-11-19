# Public Hackathon Leaderboard

Vue 3 + TypeScript + Pinia 정적 리더보드입니다. Express, PostgreSQL, 로그인 서버 없이 GitHub Pages에서 실행되며 운영자는 `public/data/*.json`만 수정해 팀·과제·점수를 관리합니다.

## 구조와 로컬 실행

```text
frontend/public/data/           # 운영 데이터(JSON)
frontend/src/stores/challenge.ts # 로딩·검증·순위 계산
frontend/src/views/             # 공개 화면
.github/workflows/deploy-pages.yml
LICENSE
```

```bash
cd frontend
npm ci
npm run dev
npm run typecheck
npm run build
npm run preview
```

Node.js 22 LTS를 권장합니다. 프로젝트 Pages 경로 빌드는 PowerShell에서 다음처럼 검사합니다.

```powershell
$env:VITE_BASE_PATH='/repository-name/'
npm run build
Remove-Item Env:VITE_BASE_PATH
```

`VITE_BASE_PATH`는 `/`로 시작하고 끝나야 합니다. 조직 루트 Pages는 `/`, 프로젝트 Pages는 `/<repository-name>/`입니다.

Data 페이지의 `기본 협업 > 지도 제작` 자료 다운로드 링크는 다음 빌드 환경변수로 설정합니다.

```env
VITE_GITHUB_RELEASE_REPOSITORY=SUN-JJI/SUN-JJI.github.io
VITE_GITHUB_RELEASE_TAG=test
VITE_GITHUB_RELEASE_BUNDLE=all-assets.zip
```

로컬에서는 `.env.example`을 `.env`로 복사해 사용할 수 있습니다. GitHub Pages 배포값은
`.github/workflows/deploy-pages.yml`의 빌드 환경변수에서 관리합니다.

## GitHub Pages 배포

1. **Settings → Pages → Source**에서 **GitHub Actions**를 선택합니다.
2. **Settings → Secrets and variables → Actions → Variables**에 `VITE_BASE_PATH`를 만듭니다.
3. 루트 Pages는 `/`, 프로젝트 Pages는 예를 들어 `/public-leaderboard/`를 입력합니다.
4. `main`에 push하면 workflow가 checkout, Node 설정, `npm ci`, 타입 검사, 빌드, artifact 업로드, 배포를 수행합니다.

실패하면 **Actions → Deploy GitHub Pages**의 실패한 job/step 로그를 확인합니다. 기본 브랜치가 `main`이 아니면 workflow의 `branches`도 바꿉니다. 해시 라우팅을 사용하므로 주소는 `/<base>/#/leaderboard/...` 형태이며 직접 접속과 새로고침에도 Pages 404가 발생하지 않습니다.

## 운영 데이터

### 팀 추가

`public/data/teams.json`의 `teams`에 변경되지 않는 `teamId`와 표시용 `teamName`을 추가합니다. 팀명 변경은 이 파일만 수정하면 전체 화면에 반영됩니다.

```json
{ "teamId": "team-003", "teamName": "새 팀" }
```

### 과제 추가

`public/data/tasks.json`의 `scenarios[].tasks`에 추가합니다.

```json
{ "id": "task-03", "name": "태스크 3" }
```

### 채점 결과 추가

`public/data/leaderboard.json`의 `results`에 결과를 추가하고 `updatedAt`을 ISO 8601 날짜로 갱신합니다.

```json
{
  "submissionId": "team-003-s01-t01-v001",
  "teamId": "team-003",
  "scenarioId": "scenario-01",
  "taskId": "task-01",
  "score": 88.5,
  "status": "COMPLETED",
  "submittedAt": "2026-11-17T15:30:00+09:00",
  "gradedAt": "2026-11-17T16:10:00+09:00"
}
```

`COMPLETED` 결과 중 팀별 최고 점수를 사용합니다. 점수 내림차순이며 동점은 같은 순위, 다음 순위는 건너뛰는 경쟁 순위입니다. 잘못된 점수·날짜·참조는 해당 결과만 제외하고 경고합니다.

```text
JSON 수정 → commit/push → GitHub Actions 실행 → GitHub Pages 자동 반영
```

### 응시 상세 결과 추가

`public/data/attempts.json`의 `attempts`에 팀·시나리오·태스크·회차별 측정 결과를 추가합니다. 상단 표에는 각 팀의 1회차만 표시되고, 팀 행을 선택하면 등록된 전체 회차가 펼쳐집니다.

```json
{
  "attemptId": "team-001-s01-t01-r01",
  "teamId": "team-001",
  "scenarioId": "scenario-01",
  "taskId": "task-01",
  "round": 1,
  "completed": true,
  "submittedAt": "2026-11-18T13:01:00+09:00",
  "explorationRate": 97,
  "consistencyRate": 95,
  "contacts": 1,
  "taskScore": 0.445,
  "communicationSavings": 55,
  "finalScore": 1.065,
  "measurementStatus": "정상"
}
```

새로고침할 때 캐시 재검증과 고유 쿼리를 사용합니다. 불필요한 자동 요청은 하지 않으며 화면의 새로고침 버튼으로 갱신합니다.

## 보안 및 향후 제출 방식

GitHub Pages에 토큰, 비밀번호, PAT, 실제 `.env` 또는 비공개 저장소 자격 증명을 넣지 마세요. 브라우저에서 비공개 저장소 업로드, ZIP 검증, 자동 채점을 수행하지 않습니다. 로그인, 회원가입, 관리자 및 API 전용 코드는 정적 공개 사이트 범위에서 제거했습니다.

참가자 제출 저장소 구조는 아직 확정되지 않았습니다. 향후 선택지는 팀별 비공개 저장소, GitHub App 기반 수집, 별도 인증 제출 서비스, 운영자가 결과 JSON만 반영하는 수동 흐름입니다. 결정 전에는 참가자 ZIP을 공개 저장소에 추가하지 않습니다.

## License

The leaderboard application source code is licensed under the MIT License.

Participant submissions and third-party materials are not covered by the application's MIT License. Their use is governed by the applicable submission terms and the license declarations included with each submission. The Pretendard dependency retains its own license.
