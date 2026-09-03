export default function AboutView() {
  return (
    <div className="wide-view about-view">
      <div className="wide-view-header">
        <h2>About Ocean Explorer 3D v2</h2>
        <p>A lightweight, interactive frontend for exploring ocean science data.</p>
      </div>

      <div className="about-grid">
        <div className="panel-card">
          <div className="panel-card-header"><span>What this is</span></div>
          <p className="about-text">
            Ocean Explorer 3D v2 is a frontend dashboard for visualizing ocean observation data —
            Argo float positions and trajectories, sea surface temperature, salinity, pressure and
            currents — on an interactive 3D globe. It is built to stay fast on an average laptop.
          </p>
        </div>

        <div className="panel-card">
          <div className="panel-card-header"><span>Tech stack</span></div>
          <ul className="about-list">
            <li>React + Vite</li>
            <li>Three.js via React Three Fiber, Drei helpers</li>
            <li>Standard WebGL — no WebGPU dependency</li>
            <li>Plain CSS, Lucide icons</li>
          </ul>
        </div>

        <div className="panel-card">
          <div className="panel-card-header"><span>Data</span></div>
          <p className="about-text">
            The first version ships with a small bundled sample dataset (~20 Argo floats and
            procedurally generated ocean fields) so the app runs instantly with no network
            dependency. The data service layer in <code>src/services</code> is structured so real
            ocean data APIs can be swapped in without touching the UI components.
          </p>
        </div>

        <div className="panel-card">
          <div className="panel-card-header"><span>Controls</span></div>
          <ul className="about-list">
            <li>Left-click + drag to rotate the globe</li>
            <li>Scroll to zoom in / out</li>
            <li>Click a glowing marker to see float details</li>
            <li>Toggle layers from the left sidebar</li>
            <li>Scrub the timeline to change year</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
