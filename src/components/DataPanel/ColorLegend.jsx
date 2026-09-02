import { temperatureColor, speedColor } from '../../data/sampleOceanData.js'

export default function ColorLegend({ min, max, unit = '', speed = false, horizontal = false, colorFor }) {
  const resolvedColorFor = colorFor || (speed ? speedColor : temperatureColor)
  const stopsCount = 24
  const gradientStops = Array.from({ length: stopsCount }, (_, i) => {
    const v = min + (i / (stopsCount - 1)) * (max - min)
    return resolvedColorFor(v)
  })

  if (horizontal) {
    return (
      <div className="legend-row-horizontal">
        <div
          className="legend-bar-horizontal"
          style={{ background: `linear-gradient(to right, ${gradientStops.join(', ')})` }}
        />
        <div className="legend-labels-horizontal">
          <span>{min}{unit}</span>
          <span>{((max + min) / 2).toFixed(unit ? 1 : 0)}{unit}</span>
          <span>{max}{unit}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="legend-row">
      <div className="legend-bar-vertical" style={{ background: `linear-gradient(to top, ${gradientStops.join(', ')})` }} />
      <div className="legend-labels-vertical">
        <span>{max}{unit}</span>
        <span>{((max + min) / 2).toFixed(unit ? 1 : 0)}{unit}</span>
        <span>{min}{unit}</span>
      </div>
    </div>
  )
}
