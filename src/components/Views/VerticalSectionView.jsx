import VerticalProfileChart from '../DataPanel/VerticalProfileChart.jsx'

export default function VerticalSectionView({ float, floats, onSelectFloat, loading }) {
  return (
    <div className="wide-view">
      <div className="wide-view-header">
        <h2>Vertical Section</h2>
        <p>Real depth profile for the selected Argo float — temperature, salinity, pressure and (when available) oxygen, fetched live from Argovis.</p>
      </div>

      <div className="vertical-section-body">
        <div className="float-picker">
          <span className="float-picker-title">Select a float ({floats.length} shown)</span>
          <div className="float-picker-list">
            {floats.map((f) => (
              <button
                key={f.id}
                className={float && float.id === f.id ? 'float-chip active' : 'float-chip'}
                onClick={() => onSelectFloat(f)}
                title={`${f.lat}°, ${f.lon}° · ${f.date.label}`}
              >
                {f.wmo}
              </button>
            ))}
            {floats.length === 0 && <span className="empty-hint">No floats loaded for this region/year yet.</span>}
          </div>
        </div>

        <div className="vertical-section-chart">
          {loading && !float && <p className="empty-hint">Loading real profile from Argovis…</p>}
          <VerticalProfileChart float={float} />
        </div>
      </div>
    </div>
  )
}
