import { useCallback } from 'react'
import HeatmapCanvas from './HeatmapCanvas.jsx'
import ColorLegend from './ColorLegend.jsx'
import {
  temperatureAt, temperatureColor,
  salinityAt, salinityColor,
  pressureAt, pressureColor,
} from '../../data/sampleOceanData.js'

const PREVIEW_DEPTHS = [0, 250, 500, 1000]

const METRICS = {
  temperature: { valueFn: temperatureAt, colorFn: temperatureColor, min: 0, max: 30 },
  salinity: { valueFn: salinityAt, colorFn: salinityColor, min: 32, max: 37 },
  pressure: { valueFn: (lat, lon, depth) => pressureAt(depth, lat, lon), colorFn: pressureColor, min: 0, max: 2000 },
}

export default function DepthPreviewRow({ title, unit, region, metric }) {
  const cfg = METRICS[metric]
  return (
    <section className="panel-card depth-preview-card">
      <div className="panel-card-header">
        <span>{title}</span>
      </div>
      <div className="depth-preview-grid">
        {PREVIEW_DEPTHS.map((d) => (
          <DepthThumb key={d} depth={d} region={region} cfg={cfg} />
        ))}
      </div>
      <ColorLegend min={cfg.min} max={cfg.max} unit={unit} horizontal colorFor={cfg.colorFn} />
    </section>
  )
}

function DepthThumb({ depth, region, cfg }) {
  const valueAt = useCallback((lat, lon) => cfg.valueFn(lat, lon, depth), [depth, cfg])
  return (
    <div className="depth-thumb">
      <HeatmapCanvas valueAt={valueAt} colorFor={cfg.colorFn} region={region} resolution={30} height={70} className="thumb-canvas" />
      <span className="depth-thumb-label">{depth === 0 ? '0 m (Surface)' : `${depth} m`}</span>
    </div>
  )
}
