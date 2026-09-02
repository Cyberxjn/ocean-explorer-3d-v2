const CHARTS = [
  { key: 'temperature', label: 'Temperature (°C)', color: '#4fd8e8' },
  { key: 'salinity', label: 'Salinity (PSU)', color: '#5ee89a' },
  { key: 'pressure', label: 'Pressure (dbar)', color: '#c96be0' },
  { key: 'oxygen', label: 'Oxygen (µmol/kg)', color: '#e8b84f' },
]

function buildPath(levels, key, w, h, min, max, maxDepth) {
  return levels
    .map((p, i) => {
      const x = ((p[key] - min) / (max - min || 1)) * w
      const y = (p.depth / maxDepth) * h
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
}

export default function VerticalProfileChart({ float }) {
  if (!float || !float.profile || float.profile.length === 0) {
    return (
      <section className="panel-card profile-card">
        <div className="panel-card-header">
          <span>Vertical Profile</span>
        </div>
        <p className="empty-hint">Select an Argo float on the globe to see its real depth profile.</p>
      </section>
    )
  }

  const profile = float.profile.filter((p) => p.depth != null)
  const maxDepth = Math.max(...profile.map((p) => p.depth), 1)
  const W = 110
  const H = 90

  const chartsWithData = CHARTS.filter((c) => profile.some((p) => p[c.key] != null))

  return (
    <section className="panel-card profile-card">
      <div className="panel-card-header">
        <span>Vertical Profile (WMO {float.wmo || float.id})</span>
      </div>
      <div className="profile-grid">
        {chartsWithData.map((c) => {
          const levels = profile.filter((p) => p[c.key] != null)
          if (levels.length < 2) return null
          const values = levels.map((p) => p[c.key])
          const min = Math.min(...values) - Math.abs(Math.min(...values) * 0.05 || 0.5)
          const max = Math.max(...values) + Math.abs(Math.max(...values) * 0.05 || 0.5)
          const path = buildPath(levels, c.key, W, H, min, max, maxDepth)
          return (
            <div className="profile-chart" key={c.key}>
              <span className="profile-chart-title" style={{ color: c.color }}>{c.label}</span>
              <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H}>
                <line x1={0} y1={0} x2={0} y2={H} stroke="rgba(255,255,255,0.08)" />
                <line x1={0} y1={H} x2={W} y2={H} stroke="rgba(255,255,255,0.08)" />
                <path d={path} fill="none" stroke={c.color} strokeWidth="1.5" />
                {levels.map((p, i) => {
                  const x = ((p[c.key] - min) / (max - min || 1)) * W
                  const y = (p.depth / maxDepth) * H
                  return <circle key={i} cx={x} cy={y} r="1.5" fill={c.color} />
                })}
              </svg>
            </div>
          )
        })}
      </div>
      {chartsWithData.length < CHARTS.length && (
        <p className="empty-hint">
          {CHARTS.length - chartsWithData.length === 1 ? 'One variable' : 'Some variables'} not recorded by this float
          {!chartsWithData.includes(CHARTS[3]) ? ' (oxygen requires a BGC float)' : ''}.
        </p>
      )}
      <div className="profile-axis-label">Depth (m, ≈ dbar) →</div>
    </section>
  )
}
