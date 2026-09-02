import { useEffect, useRef } from 'react'
import { currentVectorAt, speedColor, REGIONS } from '../../data/sampleOceanData.js'

export default function CurrentsCanvas({ region = null, height = 140 }) {
  const canvasRef = useRef()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const width = canvas.width
    const h = canvas.height
    const bounds = region && REGIONS[region] ? REGIONS[region] : { latRange: [-75, 80], lonRange: [-180, 180] }
    const [latMin, latMax] = bounds.latRange
    const [lonMin, lonMax] = bounds.lonRange
    const res = 48

    const cellW = width / res
    const cellH = h / res
    for (let i = 0; i < res; i++) {
      const lat = latMax - (i / res) * (latMax - latMin)
      for (let j = 0; j < res; j++) {
        const lon = lonMin + (j / res) * (lonMax - lonMin)
        const { speed } = currentVectorAt(lat, lon)
        ctx.fillStyle = speedColor(speed)
        ctx.fillRect(j * cellW, i * cellH, cellW + 1, cellH + 1)
      }
    }

    // sparse arrow glyphs for direction
    ctx.strokeStyle = 'rgba(230, 242, 245, 0.55)'
    ctx.lineWidth = 1
    const arrowRes = 12
    for (let i = 0; i < arrowRes; i++) {
      const lat = latMax - (i / arrowRes) * (latMax - latMin)
      for (let j = 0; j < arrowRes; j++) {
        const lon = lonMin + (j / arrowRes) * (lonMax - lonMin)
        const { dx, dy } = currentVectorAt(lat, lon)
        const cx = ((j + 0.5) / arrowRes) * width
        const cy = ((i + 0.5) / arrowRes) * h
        const len = 6
        ctx.beginPath()
        ctx.moveTo(cx - dx * len, cy + dy * len)
        ctx.lineTo(cx + dx * len, cy - dy * len)
        ctx.stroke()
      }
    }
  }, [region])

  return <canvas ref={canvasRef} width={340} height={height} />
}
