// Data service layer for Argo float data — REAL data, via our FastAPI
// backend (backend/main.py), which in turn calls Argovis
// (https://argovis-api.colorado.edu), the public Argo data API.
//
//   Argovis (real Argo GDAC data) -> FastAPI backend -> this adapter
//   -> React components (Globe, Sidebar, FloatPopup, VerticalProfileChart...)
//
// This file's exported function names/shapes intentionally match the
// project's original mock data service so no UI component had to change:
// components only ever depended on this module's contract, never on where
// the data came from.
//
// Notable shape decision: the floats LIST only carries id/lat/lon/date —
// requesting full per-level measurements for every marker up front would be
// slow and defeats the point of a lightweight listing endpoint. Full detail
// (temperature/salinity/pressure/oxygen vs depth) is fetched on demand via
// fetchFloatProfile() when a float is actually selected, matching how a
// real oceanographic dashboard would behave.

import { getFloats, getProfile, getTrajectory } from './argoService.js'
import { ApiError } from './api.js'

const REGION_TO_SLUG = {
  'Indian Ocean': 'indian_ocean',
  'Pacific Ocean': 'pacific_ocean',
  'Atlantic Ocean': 'atlantic_ocean',
  'Southern Ocean': 'southern_ocean',
}

const TRAJECTORY_COLOR = '#4fd8e8'

function regionToSlug(region) {
  return REGION_TO_SLUG[region] || undefined // "All Regions" / unknown -> no filter (global)
}

// Turns an ISO timestamp into the {year, label} shape the UI displays,
// e.g. "2011-05-31T04:48:00.000Z" -> { year: 2011, label: "31 May 2011" }
export function formatDate(iso) {
  if (!iso) return { year: null, label: 'Unknown date' }
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return { year: null, label: iso }
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return {
    year: d.getUTCFullYear(),
    label: `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`,
  }
}

/** List of real Argo profile locations for the globe's markers. */
export async function fetchArgoFloats({ year, region, limit = 40, signal } = {}) {
  const res = await getFloats({ region: regionToSlug(region), year, limit, signal })
  return res.floats.map((f) => ({
    id: f.id,
    wmo: f.wmo,
    cycleNumber: f.cycle_number,
    lat: f.lat,
    lon: f.lon,
    date: formatDate(f.date),
    basin: region && region !== 'All Regions' ? region : null,
  }))
}

/** Nearest recorded level to a target depth — never interpolated. */
export function nearestLevel(levels, targetDepth) {
  if (!levels || levels.length === 0) return null
  let best = levels[0]
  let bestDist = Infinity
  for (const lv of levels) {
    if (lv.depth == null) continue
    const dist = Math.abs(lv.depth - targetDepth)
    if (dist < bestDist) {
      best = lv
      bestDist = dist
    }
  }
  return best
}

/**
 * Full real profile for one float: every recorded level (pressure,
 * temperature, salinity, oxygen-if-present), plus lat/lon/date. Fetched
 * only when a marker is actually clicked.
 */
export async function fetchFloatProfile(floatId, { signal } = {}) {
  const p = await getProfile(floatId, { signal })

  const levels = p.levels.map((lv) => ({
    depth: lv.depth_m,
    pressure: lv.pressure,
    temperature: lv.temperature,
    salinity: lv.salinity,
    oxygen: lv.oxygen,
  }))

  const shallowest = levels.reduce((best, lv) => {
    if (lv.depth == null) return best
    if (!best || lv.depth < best.depth) return lv
    return best
  }, null)

  return {
    id: p.id,
    wmo: p.wmo,
    cycleNumber: p.cycle_number,
    lat: p.lat,
    lon: p.lon,
    date: formatDate(p.date),
    hasOxygen: p.has_oxygen,
    sourceUrl: p.source_url,
    profile: levels,
    // headline summary values shown in the popup before a depth is picked —
    // start from the shallowest real measurement, i.e. closest to the surface
    depth: shallowest ? shallowest.depth : null,
    temperature: shallowest ? shallowest.temperature : null,
    salinity: shallowest ? shallowest.salinity : null,
    pressure: shallowest ? shallowest.pressure : null,
    oxygen: shallowest ? shallowest.oxygen : null,
  }
}

/**
 * Real historical trajectory for the float's platform (WMO), built from
 * that platform's other profile locations over time. Returned already
 * wrapped in the single-item-array shape ArgoTrajectories/TrajectoryLegend
 * expect (the UI was built to show 0+ trajectories at once).
 */
export async function fetchArgoTrajectory(floatId, { signal } = {}) {
  const t = await getTrajectory(floatId, { signal })
  if (!t.points || t.points.length < 2) {
    return [] // not enough real history to draw a line
  }
  return [
    {
      id: t.wmo,
      color: TRAJECTORY_COLOR,
      path: t.points.map((pt) => ({
        lat: pt.lat,
        lon: pt.lon,
        year: formatDate(pt.date).year,
        date: pt.date,
      })),
    },
  ]
}

export { ApiError }
