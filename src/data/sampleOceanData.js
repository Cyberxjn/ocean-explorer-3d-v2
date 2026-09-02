// Lightweight procedurally generated ocean fields used for the 2D panels
// and the optional globe temperature overlay. Small enough to compute on
// the fly instead of shipping a large dataset.

function seededRandom(seed) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

// Cheap multi-octave noise built from sine waves (no external noise lib needed)
export function pseudoNoise(x, y, seedOffset = 0) {
  const a = Math.sin(x * 1.7 + seedOffset) * Math.cos(y * 1.3 - seedOffset)
  const b = Math.sin(x * 0.6 - y * 0.9 + seedOffset * 0.5)
  const c = Math.cos(x * 3.1 + y * 2.4)
  return (a * 0.5 + b * 0.35 + c * 0.15)
}

// Returns temperature in Celsius for a lat/lon, roughly warmer at the equator,
// modulated by gentle noise so the field isn't a flat gradient.
export function temperatureAt(lat, lon, depth = 0) {
  const equatorFactor = 1 - Math.abs(lat) / 90
  const base = -1 + equatorFactor * 29
  const noise = pseudoNoise(lon * 0.05, lat * 0.05) * 4
  const depthDecay = Math.exp(-depth / 650)
  return +((base + noise) * depthDecay).toFixed(1)
}

export function salinityAt(lat, lon, depth = 0) {
  const equatorFactor = 1 - Math.abs(lat) / 90
  const base = 33.8 + equatorFactor * 1.6
  const noise = pseudoNoise(lon * 0.06, lat * 0.06, 88) * 0.6
  const depthAdj = Math.exp(-depth / 900) * 0.5
  return +(base + noise + depthAdj).toFixed(2)
}

export function pressureAt(depth = 0, lat = 0, lon = 0) {
  const noise = pseudoNoise(lon * 0.04, lat * 0.04, 200) * 4
  return +(depth * 1.0075 + noise).toFixed(1)
}

export function salinityColor(psu) {
  const stops = [
    { s: 32, c: [16, 40, 90] },
    { s: 33.5, c: [22, 90, 140] },
    { s: 34.5, c: [40, 150, 150] },
    { s: 35.2, c: [130, 190, 110] },
    { s: 36, c: [214, 176, 60] },
    { s: 37, c: [170, 60, 60] },
  ]
  let lo = stops[0]
  let hi = stops[stops.length - 1]
  for (let i = 0; i < stops.length - 1; i++) {
    if (psu >= stops[i].s && psu <= stops[i + 1].s) {
      lo = stops[i]
      hi = stops[i + 1]
      break
    }
  }
  const span = hi.s - lo.s || 1
  const f = Math.min(1, Math.max(0, (psu - lo.s) / span))
  const c = lo.c.map((v, i) => Math.round(v + (hi.c[i] - v) * f))
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`
}

export function pressureColor(dbar) {
  const t = Math.min(1, Math.max(0, dbar / 2000))
  const stops = [
    [10, 30, 70],
    [20, 100, 150],
    [40, 170, 170],
    [214, 176, 60],
    [190, 60, 50],
  ]
  const scaled = t * (stops.length - 1)
  const idx = Math.min(stops.length - 2, Math.floor(scaled))
  const f = scaled - idx
  const c = stops[idx].map((v, i) => Math.round(v + (stops[idx + 1][i] - v) * f))
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`
}

export function currentVectorAt(lat, lon) {
  const angle = pseudoNoise(lon * 0.08, lat * 0.08, 12) * Math.PI * 2
  const magnitude = 0.3 + Math.abs(pseudoNoise(lon * 0.03, lat * 0.03, 40)) * 1.4
  return {
    dx: Math.cos(angle) * magnitude,
    dy: Math.sin(angle) * magnitude,
    speed: +magnitude.toFixed(2),
  }
}

export function temperatureColor(temp) {
  // temp roughly -2 to 30 C
  const stops = [
    { t: -2, c: [12, 30, 74] },
    { t: 5, c: [18, 76, 140] },
    { t: 12, c: [26, 140, 160] },
    { t: 18, c: [58, 191, 143] },
    { t: 24, c: [232, 196, 58] },
    { t: 28, c: [232, 98, 47] },
    { t: 32, c: [193, 31, 46] },
  ]
  let lo = stops[0]
  let hi = stops[stops.length - 1]
  for (let i = 0; i < stops.length - 1; i++) {
    if (temp >= stops[i].t && temp <= stops[i + 1].t) {
      lo = stops[i]
      hi = stops[i + 1]
      break
    }
  }
  const span = hi.t - lo.t || 1
  const f = Math.min(1, Math.max(0, (temp - lo.t) / span))
  const c = lo.c.map((v, i) => Math.round(v + (hi.c[i] - v) * f))
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`
}

export function speedColor(speed) {
  const stops = [
    { s: 0, c: [8, 28, 48] },
    { s: 0.4, c: [20, 90, 130] },
    { s: 0.8, c: [40, 160, 170] },
    { s: 1.2, c: [140, 200, 120] },
    { s: 1.7, c: [232, 196, 58] },
  ]
  let lo = stops[0]
  let hi = stops[stops.length - 1]
  for (let i = 0; i < stops.length - 1; i++) {
    if (speed >= stops[i].s && speed <= stops[i + 1].s) {
      lo = stops[i]
      hi = stops[i + 1]
      break
    }
  }
  const span = hi.s - lo.s || 1
  const f = Math.min(1, Math.max(0, (speed - lo.s) / span))
  const c = lo.c.map((v, i) => Math.round(v + (hi.c[i] - v) * f))
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`
}

export const REGIONS = {
  'Indian Ocean': { latRange: [-45, 25], lonRange: [40, 120] },
  'Pacific Ocean': { latRange: [-50, 50], lonRange: [-180, -100] },
  'Atlantic Ocean': { latRange: [-50, 50], lonRange: [-60, -10] },
  'Southern Ocean': { latRange: [-70, -40], lonRange: [-180, 180] },
}

export function yearlyTrend(region) {
  const bounds = REGIONS[region] || { latRange: [-40, 40] }
  const midLat = (bounds.latRange[0] + bounds.latRange[1]) / 2
  const baseline = 12 + (1 - Math.abs(midLat) / 90) * 14
  const years = []
  for (let y = 2010; y <= 2024; y++) {
    const warming = (y - 2010) * 0.045
    const noise = pseudoNoise(y * 0.7, midLat * 0.1, 300) * 0.6
    years.push({ year: y, value: +(baseline + warming + noise).toFixed(2) })
  }
  return years
}

export const _seededRandom = seededRandom
