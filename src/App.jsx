import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import TopNav from './components/TopNav.jsx'
import Sidebar from './components/Sidebar/Sidebar.jsx'
import Globe from './components/Globe/Globe.jsx'
import GlobeHUD from './components/Globe/GlobeHUD.jsx'
import FloatPopup from './components/Globe/FloatPopup.jsx'
import RightPanels from './components/DataPanel/RightPanels.jsx'
import DepthPreviewRow from './components/DataPanel/DepthPreviewRow.jsx'
import VerticalProfileChart from './components/DataPanel/VerticalProfileChart.jsx'
import TrajectoryLegend from './components/DataPanel/TrajectoryLegend.jsx'
import DataSummary from './components/DataPanel/DataSummary.jsx'
import Timeline from './components/Timeline/Timeline.jsx'
import Map2DView from './components/Views/Map2DView.jsx'
import VerticalSectionView from './components/Views/VerticalSectionView.jsx'
import TimeseriesView from './components/Views/TimeseriesView.jsx'
import AboutView from './components/Views/AboutView.jsx'
import {
  fetchArgoFloats,
  fetchFloatProfile,
  fetchArgoTrajectory,
  nearestLevel,
} from './services/argoData.js'
import { checkHealth } from './services/argoService.js'
import { ApiError } from './services/api.js'
import { DEPTH_LEVELS_M } from './data/sampleArgoData.js'
import './App.css'

const DEFAULT_LAYERS = {
  sst: true,
  temp3d: true,
  salinity: true,
  currents: true,
  dissolvedOxygen: false,
  chlorophyll: false,
  ssh: false,
  bathymetry: true,
  argoFloats: true,
  argoTrajectories: true,
}

export default function App() {
  const [activeTab, setActiveTab] = useState('3D Globe')
  const [layers, setLayers] = useState(DEFAULT_LAYERS)
  const [depthIndex, setDepthIndex] = useState(3)
  const [parameter, setParameter] = useState('Temperature')
  const [region, setRegion] = useState('Indian Ocean')
  const [year, setYear] = useState(2024)

  const [floats, setFloats] = useState([])
  const [floatsLoading, setFloatsLoading] = useState(false)
  const [floatsError, setFloatsError] = useState(null)

  const [selectedFloatSummary, setSelectedFloatSummary] = useState(null) // lightweight, instant
  const [selectedFloatDetail, setSelectedFloatDetail] = useState(null) // full real profile
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState(null)

  const [trajectories, setTrajectories] = useState([])
  const [visibleTrajIds, setVisibleTrajIds] = useState(new Set())

  const [backendStatus, setBackendStatus] = useState('checking') // checking | ok | down

  const globeRef = useRef()

  const depth = DEPTH_LEVELS_M[depthIndex]

  // --- backend reachability, checked once on load ---
  useEffect(() => {
    let cancelled = false
    checkHealth()
      .then(() => !cancelled && setBackendStatus('ok'))
      .catch(() => !cancelled && setBackendStatus('down'))
    return () => {
      cancelled = true
    }
  }, [])

  // --- real Argo floats for the current region/year ---
  useEffect(() => {
    const controller = new AbortController()
    setFloatsLoading(true)
    setFloatsError(null)

    fetchArgoFloats({ year, region, limit: 40, signal: controller.signal })
      .then((data) => {
        setFloats(data)
        setFloatsLoading(false)
        setSelectedFloatSummary((prev) => {
          if (prev && data.some((f) => f.id === prev.id)) return prev
          return data[0] || null
        })
        if (data.length === 0) setSelectedFloatSummary(null)
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        setFloatsLoading(false)
        setFloatsError(err instanceof ApiError ? err.message : 'Failed to load floats.')
        setFloats([])
      })

    return () => controller.abort()
  }, [year, region])

  // --- real profile + trajectory for the selected float ---
  useEffect(() => {
    if (!selectedFloatSummary) {
      setSelectedFloatDetail(null)
      setTrajectories([])
      return
    }
    const controller = new AbortController()
    setProfileLoading(true)
    setProfileError(null)

    Promise.all([
      fetchFloatProfile(selectedFloatSummary.id, { signal: controller.signal }),
      fetchArgoTrajectory(selectedFloatSummary.id, { signal: controller.signal }).catch(() => []),
    ])
      .then(([profile, traj]) => {
        setSelectedFloatDetail(profile)
        setProfileLoading(false)
        setTrajectories(traj)
        setVisibleTrajIds(new Set(traj.map((t) => t.id)))
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        setProfileLoading(false)
        setProfileError(err instanceof ApiError ? err.message : 'Failed to load this float\u2019s profile.')
        setSelectedFloatDetail(null)
      })

    return () => controller.abort()
  }, [selectedFloatSummary])

  const toggleLayer = useCallback((key) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const toggleTrajectory = useCallback((id) => {
    setVisibleTrajIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const visibleTrajectories = useMemo(
    () => trajectories.filter((t) => visibleTrajIds.has(t.id)),
    [trajectories, visibleTrajIds]
  )

  // depth slider connects here: pick the float's nearest REAL recorded
  // level to the selected depth (never interpolated, never invented)
  const popupFloat = useMemo(() => {
    if (!selectedFloatSummary) return null
    const base = selectedFloatDetail || selectedFloatSummary
    if (!selectedFloatDetail) return base
    const nearest = nearestLevel(selectedFloatDetail.profile, depth)
    return {
      ...selectedFloatDetail,
      depth: nearest ? nearest.depth : selectedFloatDetail.depth,
      temperature: nearest ? nearest.temperature : selectedFloatDetail.temperature,
      salinity: nearest ? nearest.salinity : selectedFloatDetail.salinity,
      pressure: nearest ? nearest.pressure : selectedFloatDetail.pressure,
      oxygen: nearest ? nearest.oxygen : selectedFloatDetail.oxygen,
    }
  }, [selectedFloatSummary, selectedFloatDetail, depth])

  const currentDateLabel = useMemo(() => {
    if (popupFloat && popupFloat.date) return popupFloat.date.label
    return `1 Jan ${year}`
  }, [popupFloat, year])

  return (
    <div className="app-shell">
      <TopNav activeTab={activeTab} onTabChange={setActiveTab} currentDate={currentDateLabel} />

      {backendStatus === 'down' && (
        <div className="backend-banner">
          Can&apos;t reach the backend API. Start it with <code>uvicorn main:app --reload</code> inside{' '}
          <code>backend/</code>, then reload this page. The globe below has no float data until then.
        </div>
      )}

      {activeTab === '3D Globe' && (
        <div className="main-layout">
          <Sidebar
            layers={layers}
            onToggleLayer={toggleLayer}
            depthIndex={depthIndex}
            onDepthChange={setDepthIndex}
            parameter={parameter}
            onParameterChange={setParameter}
            region={region}
            onRegionChange={setRegion}
          />

          <div className="center-column">
            <div className="globe-stage">
              <span className="globe-date-label">
                {popupFloat && popupFloat.date ? popupFloat.date.label : `1 Jan ${year}`} · 00:00 UTC
              </span>

              {floatsLoading && <span className="globe-loading-badge">Loading real Argo floats…</span>}
              {floatsError && <span className="globe-loading-badge error">{floatsError}</span>}

              <Globe
                ref={globeRef}
                floats={layers.argoFloats ? floats : []}
                trajectories={visibleTrajectories}
                showTrajectories={layers.argoTrajectories}
                showTemperature={layers.temp3d}
                showCurrents={layers.currents}
                depth={depth}
                year={year}
                selectedFloatId={selectedFloatSummary ? selectedFloatSummary.id : null}
                onSelectFloat={setSelectedFloatSummary}
              />

              <GlobeHUD
                onReset={() => globeRef.current && globeRef.current.reset()}
                onZoomIn={() => globeRef.current && globeRef.current.dolly(0.85)}
                onZoomOut={() => globeRef.current && globeRef.current.dolly(1.18)}
              />

              {popupFloat && (
                <FloatPopup
                  float={popupFloat}
                  loading={profileLoading}
                  error={profileError}
                  depthLabel={`Depth ≈ ${depth === 0 ? 'Surface' : `${depth} m`} (nearest level)`}
                  onClose={() => setSelectedFloatSummary(null)}
                  onViewProfile={() => setActiveTab('Vertical Section')}
                />
              )}
            </div>

            <Timeline year={year} onYearChange={setYear} />

            <div className="bottom-panels">
              <DepthPreviewRow title="Temperature at Various Depths (sample field)" unit="°C" region={region} metric="temperature" />
              <DepthPreviewRow title="Salinity at Various Depths (sample field, PSU)" unit="" region={region} metric="salinity" />
              <DepthPreviewRow title="Pressure (dbar) at Various Depths (sample field)" unit="" region={region} metric="pressure" />
            </div>

            <div className="bottom-panels bottom-panels-secondary">
              <TrajectoryLegend
                trajectories={trajectories}
                visibleIds={visibleTrajIds}
                onToggle={toggleTrajectory}
              />
              <VerticalProfileChart float={selectedFloatDetail} />
              <DataSummary
                floatCount={floats.length}
                region={region}
                year={year}
                depth={depth}
                selectedFloat={selectedFloatDetail}
              />
            </div>
          </div>

          <RightPanels region={region === 'All Regions' ? null : region} />
        </div>
      )}

      {activeTab === '2D Map' && <Map2DView region={region} depth={depth} />}

      {activeTab === 'Vertical Section' && (
        <VerticalSectionView
          float={selectedFloatDetail}
          floats={floats}
          onSelectFloat={setSelectedFloatSummary}
          loading={profileLoading}
        />
      )}

      {activeTab === 'Timeseries' && <TimeseriesView region={region} />}

      {activeTab === 'About' && <AboutView />}
    </div>
  )
}
