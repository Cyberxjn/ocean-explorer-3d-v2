import { Home, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'

export default function GlobeHUD({ onReset, onZoomIn, onZoomOut }) {
  return (
    <div className="globe-hud">
      <button className="hud-btn" onClick={onReset} title="Reset view">
        <Home size={16} />
      </button>
      <button className="hud-btn" onClick={onZoomIn} title="Zoom in">
        <ZoomIn size={16} />
      </button>
      <button className="hud-btn" onClick={onZoomOut} title="Zoom out">
        <ZoomOut size={16} />
      </button>
      <button className="hud-btn" onClick={onReset} title="Reset rotation">
        <RotateCcw size={16} />
      </button>
    </div>
  )
}
