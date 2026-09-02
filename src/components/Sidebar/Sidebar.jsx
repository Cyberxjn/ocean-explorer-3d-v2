import { ChevronDown } from 'lucide-react'
import { DEPTH_LEVELS_M } from '../../data/sampleArgoData.js'

const LAYER_LABELS = [
  { key: 'sst', label: 'Sea Surface Temp.' },
  { key: 'temp3d', label: 'Temperature (3D)' },
  { key: 'salinity', label: 'Salinity' },
  { key: 'currents', label: 'Currents' },
  { key: 'dissolvedOxygen', label: 'Dissolved Oxygen' },
  { key: 'chlorophyll', label: 'Chlorophyll' },
  { key: 'ssh', label: 'Sea Surface Height' },
  { key: 'bathymetry', label: 'Bathymetry' },
  { key: 'argoFloats', label: 'Argo Floats' },
  { key: 'argoTrajectories', label: 'Argo Trajectories' },
]

const PARAMETERS = ['Temperature', 'Salinity', 'Pressure']
const REGIONS = ['All Regions', 'Indian Ocean', 'Pacific Ocean', 'Atlantic Ocean', 'Southern Ocean']

export default function Sidebar({ layers, onToggleLayer, depthIndex, onDepthChange, parameter, onParameterChange, region, onRegionChange }) {
  return (
    <aside className="sidebar">
      <section className="panel-section">
        <h3 className="section-title">Data Layers</h3>
        <div className="layer-list">
          {LAYER_LABELS.map((l) => (
            <label className="layer-item" key={l.key}>
              <input
                type="checkbox"
                checked={!!layers[l.key]}
                onChange={() => onToggleLayer(l.key)}
              />
              <span className="checkbox-box" />
              <span className="layer-label">{l.label}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="panel-section">
        <h3 className="section-title">Depth Level (m)</h3>
        <div className="depth-slider-wrap">
          <input
            type="range"
            min={0}
            max={DEPTH_LEVELS_M.length - 1}
            step={1}
            value={depthIndex}
            onChange={(e) => onDepthChange(Number(e.target.value))}
            className="vertical-slider"
          />
          <div className="depth-labels">
            {DEPTH_LEVELS_M.map((d) => (
              <span key={d} className={d === DEPTH_LEVELS_M[depthIndex] ? 'depth-label active' : 'depth-label'}>
                {d === 0 ? 'Surface' : d}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="panel-section">
        <h3 className="section-title">Parameter</h3>
        <div className="select-wrap">
          <select value={parameter} onChange={(e) => onParameterChange(e.target.value)}>
            {PARAMETERS.map((p) => (
              <option key={p} value={p}>
                {p} {p === 'Temperature' ? '(°C)' : p === 'Salinity' ? '(PSU)' : '(dbar)'}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="select-chevron" />
        </div>
      </section>

      <section className="panel-section">
        <h3 className="section-title">Region</h3>
        <div className="select-wrap">
          <select value={region} onChange={(e) => onRegionChange(e.target.value)}>
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="select-chevron" />
        </div>
        <p className="region-hint">Lat/Lon bounds applied to visible data</p>
      </section>
    </aside>
  )
}
