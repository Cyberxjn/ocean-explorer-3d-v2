// Thin fetch wrapper for the FastAPI backend. Base URL comes from an
// environment variable so it's easy to point at a different host/port
// without touching code (see .env.example at the project root).

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function buildQuery(params = {}) {
  const usp = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    usp.set(key, value)
  })
  const qs = usp.toString()
  return qs ? `?${qs}` : ''
}

export async function apiGet(path, params = {}, { signal } = {}) {
  const url = `${API_BASE_URL}${path}${buildQuery(params)}`
  let response
  try {
    response = await fetch(url, { signal })
  } catch (err) {
    if (err.name === 'AbortError') throw err
    throw new ApiError(
      `Could not reach the backend at ${API_BASE_URL}. Is "uvicorn main:app --reload" running? (${err.message})`,
      0
    )
  }

  if (!response.ok) {
    let detail = response.statusText
    try {
      const body = await response.json()
      detail = body.detail || detail
    } catch {
      // response wasn't JSON — keep statusText
    }
    throw new ApiError(`API ${response.status}: ${detail}`, response.status)
  }

  return response.json()
}
