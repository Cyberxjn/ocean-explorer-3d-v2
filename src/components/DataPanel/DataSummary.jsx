export default function DataSummary({ floatCount, region, year, depth, selectedFloat }) {
  const rows = [
    ['Argo Floats Shown', floatCount.toLocaleString()],
    ['Selected Float Levels', selectedFloat ? selectedFloat.profile.length.toLocaleString() : '—'],
    ['Year', String(year)],
    ['Depth Cursor', `${depth === 0 ? 'Surface' : `${depth} m`}`],
    ['Region', region],
    ['Source', 'Argovis (Argo GDAC)'],
  ]
  return (
    <section className="panel-card">
      <div className="panel-card-header">
        <span>Data Summary <em>(Selected Region &amp; Time)</em></span>
      </div>
      <div className="summary-list">
        {rows.map(([label, value]) => (
          <div className="summary-row" key={label}>
            <span className="summary-label">{label}</span>
            <span className="summary-value">{value}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
