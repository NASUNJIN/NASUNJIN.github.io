/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly BASE_URL: string
  readonly VITE_GITHUB_RELEASE_REPOSITORY: string
  readonly VITE_GITHUB_RELEASE_TAG: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
