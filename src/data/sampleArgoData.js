// Lightweight sample Argo float dataset.
// Coordinates are placed in open-ocean areas so markers read clearly on the globe.
//
// STATUS as of the real-data integration: ARGO_FLOATS and ARGO_TRAJECTORIES
// below are NO LONGER USED by the app — src/services/argoData.js now fetches
// real floats/profiles/trajectories from the FastAPI backend (which calls
// Argovis). They're kept here for reference/offline demo purposes only.
// DEPTH_LEVELS_M is still used (it's just the fixed set of depth-slider
// stops shown in the sidebar, not float data).

const DEPTH_LEVELS = [0, 250, 500, 750, 1000, 1250, 1500, 1750, 2000]

// Seeded pseudo-random so data is stable across renders/reloads
function seededRandom(seed) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

const rand = seededRandom(6902741)

// Base ocean-only anchor points, roughly spread across the five ocean basins
const OCEAN_ANCHORS = [
  { lat: -16.45, lon: 68.32, basin: 'Indian Ocean' },
  { lat: -5.1, lon: 80.4, basin: 'Indian Ocean' },
  { lat: 10.2, lon: 65.1, basin: 'Indian Ocean' },
  { lat: -28.6, lon: 78.9, basin: 'Indian Ocean' },
  { lat: 2.3, lon: 90.5, basin: 'Indian Ocean' },
  { lat: -35.2, lon: 55.6, basin: 'Indian Ocean' },
  { lat: 18.4, lon: -152.2, basin: 'Pacific Ocean' },
  { lat: -8.7, lon: -140.1, basin: 'Pacific Ocean' },
  { lat: 32.1, lon: -170.4, basin: 'Pacific Ocean' },
  { lat: -22.3, lon: -110.6, basin: 'Pacific Ocean' },
  { lat: 5.6, lon: -125.8, basin: 'Pacific Ocean' },
  { lat: -40.1, lon: -95.3, basin: 'Pacific Ocean' },
  { lat: 40.5, lon: 165.2, basin: 'Pacific Ocean' },
  { lat: -15.8, lon: 175.4, basin: 'Pacific Ocean' },
  { lat: 25.3, lon: -45.6, basin: 'Atlantic Ocean' },
  { lat: -18.2, lon: -25.3, basin: 'Atlantic Ocean' },
  { lat: 42.1, lon: -35.7, basin: 'Atlantic Ocean' },
  { lat: -35.4, lon: -15.2, basin: 'Atlantic Ocean' },
  { lat: 8.9, lon: -30.4, basin: 'Atlantic Ocean' },
  { lat: -50.2, lon: -20.6, basin: 'Southern Ocean' },
  { lat: -58.3, lon: 75.2, basin: 'Southern Ocean' },
  { lat: -62.1, lon: 150.4, basin: 'Southern Ocean' },
  { lat: -55.6, lon: -60.3, basin: 'Southern Ocean' },
]

function jitter(base, amount, rng) {
  return base + (rng() - 0.5) * amount
}

function buildProfile(lat, rng) {
  // warmer near equator, colder toward poles; simple physically-plausible gradient
  const equatorFactor = 1 - Math.abs(lat) / 90
  const surfaceTemp = 4 + equatorFactor * 25 + jitter(0, 2, rng)
  const surfaceSalinity = 33.5 + jitter(0, 1.2, rng)

  return DEPTH_LEVELS.map((depth) => {
    const decay = Math.exp(-depth / 700)
    const temperature = +(2 + (surfaceTemp - 2) * decay).toFixed(2)
    const salinity = +(34.4 + (surfaceSalinity - 34.4) * decay + jitter(0, 0.15, rng)).toFixed(2)
    const pressure = +(depth * 1.0075 + jitter(0, 3, rng)).toFixed(1)
    const oxygen = +(180 + 90 * decay + jitter(0, 10, rng)).toFixed(1)
    return { depth, temperature, salinity, pressure, oxygen }
  })
}

function randomDateBetween(startYear, endYear, rng) {
  const start = new Date(`${startYear}-01-01`).getTime()
  const end = new Date(`${endYear}-12-31`).getTime()
  const t = start + rng() * (end - start)
  const d = new Date(t)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return {
    year: d.getFullYear(),
    label: `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`,
  }
}

export const ARGO_FLOATS = OCEAN_ANCHORS.map((anchor, i) => {
  const rng = seededRandom(6902741 + i * 37)
  const lat = jitter(anchor.lat, 6, rng)
  const lon = jitter(anchor.lon, 8, rng)
  const profile = buildProfile(lat, rng)
  const date = randomDateBetween(2010, 2024, rng)
  const surface = profile[0]
  const mid = profile[Math.floor(profile.length / 2)]

  return {
    id: `690${2700 + i}`,
    lat: +lat.toFixed(2),
    lon: +lon.toFixed(2),
    basin: anchor.basin,
    date,
    depth: mid.depth,
    temperature: mid.temperature,
    salinity: mid.salinity,
    pressure: mid.pressure,
    oxygen: mid.oxygen,
    surfaceTemperature: surface.temperature,
    profile,
  }
})

// A handful of multi-point historical trajectories (kept short & lightweight)
const TRAJECTORY_COLORS = ['#4fd8e8', '#5ee89a', '#e8b84f', '#c96be0', '#6b8ee8']

function driftPath(anchor, points, rng) {
  const path = []
  let lat = anchor.lat
  let lon = anchor.lon
  for (let i = 0; i < points; i++) {
    lat += jitter(0, 3, rng)
    lon += jitter(0, 4, rng)
    path.push({ lat: +lat.toFixed(2), lon: +lon.toFixed(2), year: 2010 + Math.floor((i / points) * 14) })
  }
  return path
}

export const ARGO_TRAJECTORIES = OCEAN_ANCHORS.slice(0, 5).map((anchor, i) => {
  const rng = seededRandom(1000 + i * 91)
  return {
    id: ARGO_FLOATS[i].id,
    color: TRAJECTORY_COLORS[i % TRAJECTORY_COLORS.length],
    visible: true,
    path: driftPath(anchor, 9, rng),
  }
})

export const DEPTH_LEVELS_M = DEPTH_LEVELS
