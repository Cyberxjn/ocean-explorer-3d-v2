import { X, MapPin, Loader2, AlertTriangle } from 'lucide-react'

export default function FloatPopup({ float, loading, error, depthLabel, onClose, onViewProfile }) {
  if (!float) return null

  return (
    <div className="float-popup">
      <div className="float-popup-header">
        <span className="float-popup-title">
          <MapPin size={13} /> ARGO FLOAT · WMO {float.wmo || float.id}
        </span>
        <button className="icon-btn" onClick={onClose} aria-label="Close">
          <X size={14} />
        </button>
      </div>

      <div className="float-popup-grid">
        <Row label="Latitude" value={`${float.lat}°`} />
        <Row label="Longitude" value={`${float.lon}°`} />
        <Row label="Date" value={float.date ? float.date.label : '—'} />
        <Row label="Cycle" value={float.cycleNumber != null ? `#${float.cycleNumber}` : '—'} />
      </div>

      <div className="float-popup-divider" />

      {loading && (
        <div className="float-popup-status">
          <Loader2 size={13} className="spin" /> Loading real profile from Argovis…
        </div>
      )}

      {error && !loading && (
        <div className="float-popup-status error">
          <AlertTriangle size={13} /> {error}
        </div>
      )}

      {!loading && !error && float.profile && (
        <>
          <div className="float-popup-grid">
            <Row label={depthLabel || 'Depth (nearest level)'} value={float.depth != null ? `${float.depth} m` : '—'} />
            <Row label="Temperature" value={float.temperature != null ? `${float.temperature} °C` : '—'} accent />
            <Row label="Salinity" value={float.salinity != null ? `${float.salinity} PSU` : '—'} accent />
            <Row label="Pressure" value={float.pressure != null ? `${float.pressure} dbar` : '—'} accent />
            {float.hasOxygen && (
              <Row label="Oxygen" value={float.oxygen != null ? `${float.oxygen} µmol/kg` : '—'} accent />
            )}
          </div>
          <p className="float-popup-note">
            {float.profile.length} recorded levels · nearest real measurement shown, not interpolated
          </p>
          {onViewProfile && (
            <button className="view-profile-btn" onClick={onViewProfile}>
              VIEW FULL PROFILE
            </button>
          )}
        </>
      )}
    </div>
  )
}

function Row({ label, value, accent }) {
  return (
    <div className="float-popup-row">
      <span className="float-popup-label">{label}</span>
      <span className={accent ? 'float-popup-value accent' : 'float-popup-value'}>{value}</span>
    </div>
  )
}
