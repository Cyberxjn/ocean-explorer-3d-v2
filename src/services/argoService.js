// Thin, direct calls to our FastAPI backend's Argo routes. These return the
// backend's JSON shape as-is — src/services/argoData.js is the adapter that
// reshapes it for the existing UI components.

import { apiGet } from './api.js'

export function getFloats({ region, year, limit = 40, signal } = {}) {
  return apiGet('/api/argo/floats', { region, year, limit }, { signal })
}

export function getProfile(floatId, { signal } = {}) {
  return apiGet(`/api/argo/profile/${encodeURIComponent(floatId)}`, {}, { signal })
}

export function getTrajectory(floatId, { signal } = {}) {
  return apiGet(`/api/argo/trajectory/${encodeURIComponent(floatId)}`, {}, { signal })
}

export function checkHealth({ signal } = {}) {
  return apiGet('/api/health', {}, { signal })
}
