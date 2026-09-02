import { useEffect, useRef } from 'react'
import { REGIONS } from '../../data/sampleOceanData.js'

// Renders a lightweight gridded scalar field (e.g. temperature) to a small
// canvas. Resolution is intentionally low — this is a dashboard preview,
// not a scientific map.
export default function HeatmapCanvas({ valueAt, colorFor, region = null, resolution = 72, height = 140, width = 340, className }) {
  const canvasRef = useRef()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const canvasWidth = canvas.width
    const h = canvas.height
    const bounds = region && REGIONS[region] ? REGIONS[region] : { latRange: [-75, 80], lonRange: [-180, 180] }
    const [latMin, latMax] = bounds.latRange
    const [lonMin, lonMax] = bounds.lonRange

    const cellW = canvasWidth / resolution
    const cellH = h / resolution

    for (let i = 0; i < resolution; i++) {
      const lat = latMax - (i / resolution) * (latMax - latMin)
      for (let j = 0; j < resolution; j++) {
        const lon = lonMin + (j / resolution) * (lonMax - lonMin)
        const value = valueAt(lat, lon)
        ctx.fillStyle = colorFor(value)
        ctx.fillRect(j * cellW, i * cellH, cellW + 1, cellH + 1)
      }
    }
  }, [valueAt, colorFor, region, resolution, width, height])

  return <canvas ref={canvasRef} width={width} height={height} className={className} />
}
