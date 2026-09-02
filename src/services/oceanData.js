// Data service layer for gridded ocean fields (temperature, currents, etc).
//
// Backed by lightweight procedural sample data for now (see
// src/data/sampleOceanData.js). Structured as async functions so a real
// data source (e.g. a backend proxying NOAA/Copernicus/Argo NetCDF data)
// can be swapped in without changing any component code.

import { temperatureAt, currentVectorAt, REGIONS } from '../data/sampleOceanData.js'

export async function fetchTemperatureGrid({ region = null, depth = 0, resolution = 36 } = {}) {
  const bounds = region && REGIONS[region] ? REGIONS[region] : { latRange: [-80, 80], lonRange: [-180, 180] }
  const [latMin, latMax] = bounds.latRange
  const [lonMin, lonMax] = bounds.lonRange
  const points = []
  const latSteps = resolution
  const lonSteps = resolution
  for (let i = 0; i < latSteps; i++) {
    const lat = latMin + (i / (latSteps - 1)) * (latMax - latMin)
    for (let j = 0; j < lonSteps; j++) {
      const lon = lonMin + (j / (lonSteps - 1)) * (lonMax - lonMin)
      points.push({ lat, lon, value: temperatureAt(lat, lon, depth) })
    }
  }
  return { points, latSteps, lonSteps, bounds }
}

export async function fetchCurrentField({ region = null, resolution = 14 } = {}) {
  const bounds = region && REGIONS[region] ? REGIONS[region] : { latRange: [-80, 80], lonRange: [-180, 180] }
  const [latMin, latMax] = bounds.latRange
  const [lonMin, lonMax] = bounds.lonRange
  const vectors = []
  for (let i = 0; i < resolution; i++) {
    const lat = latMin + (i / (resolution - 1)) * (latMax - latMin)
    for (let j = 0; j < resolution; j++) {
      const lon = lonMin + (j / (resolution - 1)) * (lonMax - lonMin)
      vectors.push({ lat, lon, ...currentVectorAt(lat, lon) })
    }
  }
  return { vectors, bounds }
}

export async function fetchVerticalProfile({ floatId, floats }) {
  const f = floats.find((x) => x.id === floatId)
  return f ? f.profile : []
}
