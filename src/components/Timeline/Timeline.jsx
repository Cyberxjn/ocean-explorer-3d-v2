import { useEffect, useRef, useState } from 'react'
import { Play, Pause } from 'lucide-react'

const START_YEAR = 2010
const END_YEAR = 2024

export default function Timeline({ year, onYearChange }) {
  const [playing, setPlaying] = useState(false)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        onYearChange((prev) => {
          const next = prev >= END_YEAR ? START_YEAR : prev + 1
          return next
        })
      }, 900)
    }
    return () => clearInterval(intervalRef.current)
  }, [playing, onYearChange])

  return (
    <div className="timeline">
      <button className="icon-btn play-btn" onClick={() => setPlaying((p) => !p)}>
        {playing ? <Pause size={15} /> : <Play size={15} />}
      </button>
      <input
        type="range"
        min={START_YEAR}
        max={END_YEAR}
        step={1}
        value={year}
        onChange={(e) => {
          setPlaying(false)
          onYearChange(Number(e.target.value))
        }}
        className="timeline-slider"
      />
      <div className="timeline-labels">
        {Array.from({ length: END_YEAR - START_YEAR + 1 }, (_, i) => START_YEAR + i)
          .filter((y) => y % 2 === 0)
          .map((y) => (
            <span key={y} className={y === year ? 'timeline-year active' : 'timeline-year'}>
              {y}
            </span>
          ))}
      </div>
    </div>
  )
}
