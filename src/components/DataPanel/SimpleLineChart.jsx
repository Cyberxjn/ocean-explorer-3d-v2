export default function SimpleLineChart({ data, xKey, yKey, color = '#4fd8e8', width = 640, height = 220, unit = '' }) {
  if (!data || data.length === 0) return null
  const values = data.map((d) => d[yKey])
  const min = Math.min(...values) - 0.3
  const max = Math.max(...values) + 0.3
  const pad = 28

  const x = (i) => pad + (i / (data.length - 1)) * (width - pad * 2)
  const y = (v) => height - pad - ((v - min) / (max - min || 1)) * (height - pad * 2)

  const path = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(d[yKey]).toFixed(1)}`).join(' ')
  const area = `${path} L${x(data.length - 1).toFixed(1)},${height - pad} L${x(0).toFixed(1)},${height - pad} Z`

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height}>
      <defs>
        <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((f) => (
        <line
          key={f}
          x1={pad}
          x2={width - pad}
          y1={pad + f * (height - pad * 2)}
          y2={pad + f * (height - pad * 2)}
          stroke="rgba(255,255,255,0.06)"
        />
      ))}
      <path d={area} fill="url(#lineFill)" stroke="none" />
      <path d={path} fill="none" stroke={color} strokeWidth="2" />
      {data.map((d, i) => (
        <circle key={i} cx={x(i)} cy={y(d[yKey])} r="2.4" fill={color} />
      ))}
      {data.map((d, i) =>
        i % 2 === 0 ? (
          <text key={i} x={x(i)} y={height - 8} fontSize="9" fill="var(--text-muted)" textAnchor="middle">
            {d[xKey]}
          </text>
        ) : null
      )}
      <text x={pad} y={16} fontSize="10" fill="var(--text-secondary)">
        {max.toFixed(1)}{unit}
      </text>
      <text x={pad} y={height - pad + 12} fontSize="10" fill="var(--text-secondary)">
        {min.toFixed(1)}{unit}
      </text>
    </svg>
  )
}
