import { useCallback } from 'react'
import HeatmapCanvas from '../DataPanel/HeatmapCanvas.jsx'
import ColorLegend from '../DataPanel/ColorLegend.jsx'
import { temperatureAt, temperatureColor } from '../../data/sampleOceanData.js'

export default function Map2DView({ region, depth }) {
  const valueAt = useCallback((lat, lon) => temperatureAt(lat, lon, depth), [depth])

  return (
    <div className="wide-view">
      <div className="wide-view-header">
        <h2>2D Ocean Temperature Map</h2>
        <p>Equirectangular projection · {region} · {depth === 0 ? 'Surface' : `${depth} m depth`}</p>
      </div>
      <div className="wide-map-wrap">
        <HeatmapCanvas
          valueAt={valueAt}
          colorFor={temperatureColor}
          region={region === 'All Regions' ? null : region}
          resolution={130}
          width={1040}
          height={440}
          className="wide-canvas"
        />
        <ColorLegend min={-2} max={32} unit="°C" colorFor={temperatureColor} />
      </div>
    </div>
  )
}
