import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { latLonToVector3 } from './geoUtils.js'

const RADIUS = 2.02

function Marker({ float, selected, onSelect }) {
  const ringRef = useRef()
  const groupRef = useRef()
  const pos = useMemo(() => latLonToVector3(float.lat, float.lon, RADIUS), [float.lat, float.lon])
  const quat = useMemo(() => {
    const normal = new THREE.Vector3(...pos).normalize()
    const q = new THREE.Quaternion()
    q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal)
    return q
  }, [pos])

  useFrame((state) => {
    if (ringRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 2 + float.lat) * 0.15
      ringRef.current.scale.setScalar(pulse)
    }
  })

  return (
    <group position={pos} quaternion={quat} ref={groupRef}>
      <mesh
        onClick={(e) => {
          e.stopPropagation()
          onSelect(float)
        }}
      >
        <sphereGeometry args={[selected ? 0.028 : 0.02, 10, 10]} />
        <meshBasicMaterial color={selected ? '#8ff3ff' : '#4fd8e8'} />
      </mesh>
      <mesh ref={ringRef} position={[0, 0, 0.001]}>
        <ringGeometry args={[0.03, 0.038, 16]} />
        <meshBasicMaterial
          color="#4fd8e8"
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

export default function ArgoMarkers({ floats, selectedId, onSelect }) {
  return (
    <group>
      {floats.map((f) => (
        <Marker key={f.id} float={f} selected={f.id === selectedId} onSelect={onSelect} />
      ))}
    </group>
  )
}
