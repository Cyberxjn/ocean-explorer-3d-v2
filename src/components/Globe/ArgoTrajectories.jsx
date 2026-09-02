import { useMemo } from 'react'
import { Line } from '@react-three/drei'
import { latLonToVector3 } from './geoUtils.js'

const RADIUS = 2.015

function TrajectoryLine({ traj, year }) {
  const points = useMemo(
    () => traj.path.filter((p) => p.year <= year).map((p) => latLonToVector3(p.lat, p.lon, RADIUS)),
    [traj, year]
  )
  if (points.length < 2) return null
  return <Line points={points} color={traj.color} lineWidth={1.4} transparent opacity={0.65} />
}

export default function ArgoTrajectories({ trajectories, year }) {
  return (
    <group>
      {trajectories.map((traj) => (
        <TrajectoryLine key={traj.id} traj={traj} year={year} />
      ))}
    </group>
  )
}
