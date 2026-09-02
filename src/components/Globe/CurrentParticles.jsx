import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { currentVectorAt } from '../../data/sampleOceanData.js'

const RADIUS = 2.03
const COUNT = 220

function randomLatLon() {
  // bias away from poles slightly for a nicer visual spread
  const lat = (Math.random() * 2 - 1) * 75
  const lon = Math.random() * 360 - 180
  return { lat, lon, life: Math.random() * 4 }
}

export default function CurrentParticles({ visible }) {
  const pointsRef = useRef()
  const particles = useMemo(() => Array.from({ length: COUNT }, randomLatLon), [])
  const positions = useMemo(() => new Float32Array(COUNT * 3), [])

  useFrame((state, delta) => {
    if (!visible || !pointsRef.current) return
    for (let i = 0; i < COUNT; i++) {
      const p = particles[i]
      const v = currentVectorAt(p.lat, p.lon)
      p.lon += v.dx * delta * 6
      p.lat += v.dy * delta * 3
      p.life -= delta

      if (p.life <= 0 || p.lat > 85 || p.lat < -85) {
        const fresh = randomLatLon()
        p.lat = fresh.lat
        p.lon = fresh.lon
        p.life = 3 + Math.random() * 3
      }
      if (p.lon > 180) p.lon -= 360
      if (p.lon < -180) p.lon += 360

      const phi = (90 - p.lat) * (Math.PI / 180)
      const theta = (p.lon + 180) * (Math.PI / 180)
      positions[i * 3] = -RADIUS * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 2] = RADIUS * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 1] = RADIUS * Math.cos(phi)
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true
  })

  if (!visible) return null

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={COUNT} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        color="#7fe8b8"
        size={0.018}
        transparent
        opacity={0.75}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}
