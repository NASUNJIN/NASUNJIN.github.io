const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message)
  }
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('ac26-token')
  const isForm = options.body instanceof FormData
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(isForm ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  const data = (await response.json().catch(() => ({}))) as T & { message?: string }
  if (!response.ok) throw new ApiError(data.message || '요청 처리에 실패했습니다.', response.status)
  return data
}

export async function downloadSubmission(id: number, filename: string) {
  const token = localStorage.getItem('ac26-token')
  const response = await fetch(`${API_BASE_URL}/submissions/${id}/download`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { message?: string }
    throw new ApiError(data.message || '다운로드에 실패했습니다.', response.status)
  }
  const url = URL.createObjectURL(await response.blob())
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
