import { useMemo } from 'react'
import SimpleLineChart from '../DataPanel/SimpleLineChart.jsx'
import { yearlyTrend } from '../../data/sampleOceanData.js'

export default function TimeseriesView({ region }) {
  const data = useMemo(() => yearlyTrend(region === 'All Regions' ? 'Indian Ocean' : region), [region])

  return (
    <div className="wide-view">
      <div className="wide-view-header">
        <h2>Sea Surface Temperature Timeseries</h2>
        <p>Regional average, 2010 – 2024 · {region}</p>
      </div>
      <div className="timeseries-chart-wrap">
        <SimpleLineChart data={data} xKey="year" yKey="value" color="#4fd8e8" unit="°C" height={340} />
      </div>
      <p className="timeseries-note">
        Derived from the bundled sample dataset. Replace <code>yearlyTrend()</code> in{' '}
        <code>src/data/sampleOceanData.js</code> with a real time-series API call to show observed data.
      </p>
    </div>
  )
}
