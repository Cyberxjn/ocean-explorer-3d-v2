import { useCallback } from 'react'
import HeatmapCanvas from './HeatmapCanvas.jsx'
import CurrentsCanvas from './CurrentsCanvas.jsx'
import ColorLegend from './ColorLegend.jsx'
import { temperatureAt, temperatureColor, speedColor } from '../../data/sampleOceanData.js'

export default function RightPanels({ region }) {
  const valueAt = useCallback((lat, lon) => temperatureAt(lat, lon, 0), [])

  return (
    <aside className="right-panels">
      <section className="panel-card">
        <div className="panel-card-header">
          <span>Sea Surface Temperature (°C)</span>
        </div>
        <div className="panel-card-body">
          <HeatmapCanvas valueAt={valueAt} colorFor={temperatureColor} region={region} />
          <ColorLegend min={-2} max={32} colorFor={temperatureColor} />
        </div>
      </section>

      <section className="panel-card">
        <div className="panel-card-header">
          <span>Ocean Currents (Surface)</span>
        </div>
        <div className="panel-card-body">
          <CurrentsCanvas region={region} />
          <ColorLegend min={0} max={1.7} unit=" m/s" colorFor={speedColor} />
        </div>
      </section>
    </aside>
  )
}
