export default function TrajectoryLegend({ trajectories, visibleIds, onToggle }) {
  return (
    <section className="panel-card">
      <div className="panel-card-header">
        <span>Argo Trajectories</span>
      </div>
      <div className="trajectory-list">
        {trajectories.map((t) => (
          <label className="trajectory-item" key={t.id}>
            <input
              type="checkbox"
              checked={visibleIds.has(t.id)}
              onChange={() => onToggle(t.id)}
            />
            <span className="trajectory-swatch" style={{ background: t.color }} />
            <span>{t.id}</span>
          </label>
        ))}
      </div>
    </section>
  )
}
