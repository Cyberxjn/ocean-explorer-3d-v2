import { Waves, Download, Camera, Bell, HelpCircle, Moon } from 'lucide-react'

const TABS = ['3D Globe', '2D Map', 'Vertical Section', 'Timeseries', 'About']

export default function TopNav({ activeTab, onTabChange, currentDate }) {
  return (
    <header className="top-nav">
      <div className="brand">
        <div className="brand-icon">
          <Waves size={16} />
        </div>
        <div className="brand-text">
          <span className="brand-title">Ocean Explorer 3D</span>
          <span className="brand-subtitle">Interactive Ocean Data Visualization</span>
        </div>
      </div>

      <nav className="top-tabs">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={tab === activeTab ? 'top-tab active' : 'top-tab'}
            onClick={() => onTabChange(tab)}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </nav>

      <div className="top-actions">
        <span className="current-date">{currentDate}</span>
        <button className="icon-btn" title="Download"><Download size={16} /></button>
        <button className="icon-btn" title="Snapshot"><Camera size={16} /></button>
        <button className="icon-btn" title="Notifications"><Bell size={16} /></button>
        <button className="icon-btn" title="Help"><HelpCircle size={16} /></button>
        <button className="icon-btn" title="Theme"><Moon size={16} /></button>
      </div>
    </header>
  )
}
