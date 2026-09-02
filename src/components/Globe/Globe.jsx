import { Suspense, useMemo, useRef, forwardRef, useImperativeHandle } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { createEarthCanvas, createTemperatureCanvas } from './earthTexture.js'
import { temperatureAt, temperatureColor } from '../../data/sampleOceanData.js'
import ArgoMarkers from './ArgoMarkers.jsx'
import ArgoTrajectories from './ArgoTrajectories.jsx'
import CurrentParticles from './CurrentParticles.jsx'

function Earth({ showTemperature, depth }) {
  const baseTexture = useMemo(() => {
    const canvas = createEarthCanvas(2048, 1024)
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }, [])

  const tempTexture = useMemo(() => {
    if (!showTemperature) return null
    const canvas = createTemperatureCanvas(temperatureAt, temperatureColor, depth, 512, 256)
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }, [showTemperature, depth])

  return (
    <mesh rotation={[0, -Math.PI / 2, 0]}>
      <sphereGeometry args={[2, 64, 64]} />
      <meshStandardMaterial
        map={showTemperature && tempTexture ? tempTexture : baseTexture}
        roughness={0.9}
        metalness={0.05}
      />
    </mesh>
  )
}

function Atmosphere() {
  return (
    <mesh>
      <sphereGeometry args={[2.09, 48, 48]} />
      <meshBasicMaterial
        color="#4fd8e8"
        transparent
        opacity={0.08}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  )
}

function ControlsBridge({ bridgeRef }) {
  const controlsRef = useRef()
  useImperativeHandle(bridgeRef, () => ({
    reset: () => controlsRef.current && controlsRef.current.reset(),
    dolly: (amount) => {
      const controls = controlsRef.current
      if (!controls) return
      controls.object.position.multiplyScalar(amount)
      controls.update()
    },
  }))
  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      minDistance={2.8}
      maxDistance={9}
      rotateSpeed={0.55}
      zoomSpeed={0.8}
      enableDamping
      dampingFactor={0.08}
    />
  )
}

const Globe = forwardRef(function Globe(
  { floats, trajectories, showTrajectories, showTemperature, showCurrents, depth, year, selectedFloatId, onSelectFloat },
  ref
) {
  return (
    <Canvas
      dpr={[1, 1.6]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      camera={{ position: [0, 0.6, 5.2], fov: 42 }}
    >
      <color attach="background" args={['#050b11']} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[5, 3, 5]} intensity={1.4} color="#eaf7ff" />
      <directionalLight position={[-5, -2, -4]} intensity={0.25} color="#2a6fa0" />

      <Suspense fallback={null}>
        <Earth showTemperature={showTemperature} depth={depth} />
        <Atmosphere />
        <ArgoMarkers floats={floats} selectedId={selectedFloatId} onSelect={onSelectFloat} />
        {showTrajectories && <ArgoTrajectories trajectories={trajectories} year={year} />}
        <CurrentParticles visible={showCurrents} />
      </Suspense>

      <ControlsBridge bridgeRef={ref} />
    </Canvas>
  )
})

export default Globe
