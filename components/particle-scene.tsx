"use client"

import { Canvas, useThree, useFrame } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import { Suspense, useCallback, useEffect, useRef, useState, useMemo } from "react"
import * as THREE from "three"
import { ParticleCloud } from "./particle-cloud"
import { sampleImageToParticles, type ParticleData } from "@/lib/image-sampler"
import {
  ControlsPanel,
  type ParticleSettings,
  type ImageEntry,
  DEFAULT_COLORS,
} from "./controls-panel"
import {
  savePreset as dbSavePreset,
  loadPresets,
  deletePreset as dbDeletePreset,
  imageDataToDataUrl,
  dataUrlToImageData,
  type Preset,
  type PresetImageData,
} from "@/lib/preset-store"

const DEFAULT_SETTINGS: ParticleSettings = {
  rows: 91,
  cols: 110,
  size: 5.8,
  sizeMin: 0.12,
  sizeMax: 1.26,
  speed: 1.65,
  range: 0.85,
  heightScale: 7.5,
  rotateSpeed: 0,
  opacityPulse: false,
  opacitySpeed: 0.8,
  opacityRange: 0.5,
  bgColor1: "#115cdd",
  bgColor2: "#115cdd",
  highlightColor: "#ffffff",
  highlightRadius: 1.8,
  colors: DEFAULT_COLORS,
  particleShape: "egg",
  shapeWaveDuration: 0.8,
}

function MouseTracker({
  mousePosRef,
  mouseActivityRef,
}: {
  mousePosRef: React.MutableRefObject<THREE.Vector3>
  mouseActivityRef: React.MutableRefObject<number>
}) {
  const { camera, raycaster, pointer } = useThree()
  const planeRef = useRef(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0))
  const intersectPoint = useRef(new THREE.Vector3())
  const prevPos = useRef(new THREE.Vector3(999, 999, 0))

  useFrame((_, delta) => {
    raycaster.setFromCamera(pointer, camera)
    const hit = raycaster.ray.intersectPlane(planeRef.current, intersectPoint.current)
    if (hit) {
      // Calculate movement speed
      const speed = hit.distanceTo(prevPos.current) / Math.max(delta, 0.001)
      prevPos.current.copy(hit)
      mousePosRef.current.copy(hit)

      // Ramp up activity when moving, decay when still
      // Speed > ~0.5 means meaningful movement
      const targetActivity = Math.min(1, speed * 0.4)
      const current = mouseActivityRef.current

      if (targetActivity > current) {
        // Ramp up quickly
        mouseActivityRef.current = Math.min(1, current + delta * 6)
      } else {
        // Decay smoothly
        mouseActivityRef.current = Math.max(0, current - delta * 1.5)
      }
    } else {
      // Mouse left the scene, fade out
      mouseActivityRef.current = Math.max(0, mouseActivityRef.current - delta * 1.5)
    }
  })

  return null
}

function GradientBackground({ color1, color2 }: { color1: string; color2: string }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const { viewport } = useThree()

  const uniforms = useMemo(
    () => ({
      uColor1: { value: new THREE.Color(color1) },
      uColor2: { value: new THREE.Color(color2) },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  useFrame(() => {
    if (!meshRef.current) return
    const mat = meshRef.current.material as THREE.ShaderMaterial
    mat.uniforms.uColor1.value.set(color1)
    mat.uniforms.uColor2.value.set(color2)
  })

  return (
    <mesh ref={meshRef} position={[0, 0, -15]} renderOrder={-1}>
      <planeGeometry args={[viewport.width * 4, viewport.height * 4]} />
      <shaderMaterial
        uniforms={uniforms}
        depthWrite={false}
        depthTest={false}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform vec3 uColor1;
          uniform vec3 uColor2;
          varying vec2 vUv;
          void main() {
            vec3 color = mix(uColor2, uColor1, vUv.y);
            gl_FragColor = vec4(color, 1.0);
          }
        `}
      />
    </mesh>
  )
}

function LoadingIndicator() {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-primary" />
        <p className="font-mono text-sm text-muted-foreground tracking-widest uppercase">
          Sampling particles
        </p>
      </div>
    </div>
  )
}

function Title() {
  return (
    <div className="absolute top-8 left-8">
      <h1 className="font-mono text-xs text-muted-foreground tracking-[0.3em] uppercase">
        Minerva Relief
      </h1>
    </div>
  )
}

export function ParticleScene() {
  const [currentData, setCurrentData] = useState<ParticleData | null>(null)
  const [targetData, setTargetData] = useState<ParticleData | null>(null)
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<ParticleSettings>(DEFAULT_SETTINGS)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const [images, setImages] = useState<ImageEntry[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [presets, setPresets] = useState<Preset[]>([])

  const particleCacheRef = useRef<Map<string, ParticleData>>(new Map())
  const mousePosRef = useRef(new THREE.Vector3(999, 999, 0))
  const mouseActivityRef = useRef(0)

  const getCacheKey = (id: string, rows: number, cols: number, heightScale: number) =>
    `${id}__${rows}x${cols}__h${heightScale}`

  const sampleForImage = useCallback(
    (entry: ImageEntry, s: ParticleSettings): ParticleData => {
      const key = getCacheKey(entry.id, s.rows, s.cols, s.heightScale)
      const cached = particleCacheRef.current.get(key)
      if (cached) return cached
      const data = sampleImageToParticles(entry.data, {
        rows: s.rows,
        cols: s.cols,
        spread: 10,
        heightScale: s.heightScale,
      })
      particleCacheRef.current.set(key, data)
      return data
    },
    []
  )

  // Load saved presets on mount
  useEffect(() => {
    loadPresets().then(setPresets).catch(() => {})
  }, [])

  const handleSavePreset = useCallback(
    async (name: string) => {
      // Convert current images to storable data URLs
      const presetImages: PresetImageData[] = images.map((img) => ({
        name: img.name,
        dataUrl: imageDataToDataUrl(img.data),
        thumbnail: img.thumbnail,
      }))

      const preset: Preset = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name,
        settings: { ...settings },
        images: presetImages,
        createdAt: Date.now(),
      }

      await dbSavePreset(preset)
      setPresets((prev) => [...prev, preset])
    },
    [images, settings]
  )

  const handleLoadPreset = useCallback(
    async (preset: Preset) => {
      // Clear cache
      particleCacheRef.current.clear()

      // Restore settings with fallback for missing particleShape/shapeWaveDuration (from old presets)
      setSettings({
        ...preset.settings,
        particleShape: preset.settings.particleShape ?? "egg",
        shapeWaveDuration: preset.settings.shapeWaveDuration ?? 0.8,
      })

      // Restore images from data URLs
      const restoredImages: ImageEntry[] = await Promise.all(
        preset.images.map(async (pi, idx) => {
          const imgData = await dataUrlToImageData(pi.dataUrl)
          return {
            id: `preset-${Date.now()}-${idx}`,
            name: pi.name,
            data: imgData,
            thumbnail: pi.thumbnail,
          }
        })
      )

      setImages(restoredImages)
      setCurrentIndex(0)

      // Sample first image
      if (restoredImages.length > 0) {
        const sampled = sampleForImage(restoredImages[0], preset.settings)
        setCurrentData(sampled)
      }
    },
    [sampleForImage]
  )

  const handleDeletePreset = useCallback(async (id: string) => {
    await dbDeletePreset(id)
    setPresets((prev) => prev.filter((p) => p.id !== id))
  }, [])

  // Load default image on mount
  useEffect(() => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.src = "/images/minerva-source.png"

    img.onload = () => {
      const canvas = document.createElement("canvas")
      const maxSize = 512
      const scale = Math.min(maxSize / img.width, maxSize / img.height)
      canvas.width = img.width * scale
      canvas.height = img.height * scale

      const ctx = canvas.getContext("2d")!
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)

      const thumbCanvas = document.createElement("canvas")
      thumbCanvas.width = 48
      thumbCanvas.height = 48
      const thumbCtx = thumbCanvas.getContext("2d")!
      const thumbScale = Math.max(48 / img.width, 48 / img.height)
      const tw = img.width * thumbScale
      const th = img.height * thumbScale
      thumbCtx.drawImage(img, (48 - tw) / 2, (48 - th) / 2, tw, th)

      const entry: ImageEntry = {
        id: "default",
        name: "Minerva Source",
        data: imgData,
        thumbnail: thumbCanvas.toDataURL("image/jpeg", 0.6),
      }

      setImages([entry])
      setCurrentIndex(0)

      const sampled = sampleImageToParticles(imgData, {
        rows: DEFAULT_SETTINGS.rows,
        cols: DEFAULT_SETTINGS.cols,
        spread: 10,
        heightScale: DEFAULT_SETTINGS.heightScale,
      })
      particleCacheRef.current.set(
        getCacheKey(entry.id, DEFAULT_SETTINGS.rows, DEFAULT_SETTINGS.cols, DEFAULT_SETTINGS.heightScale),
        sampled
      )
      setCurrentData(sampled)
      setLoading(false)
    }
  }, [])

  const handleImagesAdd = useCallback(
    (entries: ImageEntry[]) => {
      setImages((prev) => [...prev, ...entries])
    },
    []
  )

  const handleImageRemove = useCallback(
    (id: string) => {
      setImages((prev) => {
        const next = prev.filter((img) => img.id !== id)
        if (next.length === 0) return prev
        return next
      })

      setCurrentIndex((prevIdx) => {
        const currentImages = images.filter((img) => img.id !== id)
        if (prevIdx >= currentImages.length) {
          const newIdx = Math.max(0, currentImages.length - 1)
          const newEntry = currentImages[newIdx]
          if (newEntry) {
            const sampled = sampleForImage(newEntry, settings)
            setTargetData(sampled)
            setIsTransitioning(true)
          }
          return newIdx
        }
        return prevIdx
      })

      for (const key of particleCacheRef.current.keys()) {
        if (key.startsWith(`${id}__`)) {
          particleCacheRef.current.delete(key)
        }
      }
    },
    [images, sampleForImage, settings]
  )

  const handleNavigate = useCallback(
    (direction: "prev" | "next") => {
      if (isTransitioning || images.length <= 1) return

      const newIndex =
        direction === "next"
          ? (currentIndex + 1) % images.length
          : (currentIndex - 1 + images.length) % images.length

      const targetEntry = images[newIndex]
      const sampled = sampleForImage(targetEntry, settings)

      setTargetData(sampled)
      setIsTransitioning(true)
      setCurrentIndex(newIndex)
    },
    [isTransitioning, images, currentIndex, sampleForImage, settings]
  )

  const handleJumpTo = useCallback(
    (index: number) => {
      if (isTransitioning || index === currentIndex || index < 0 || index >= images.length) return

      const targetEntry = images[index]
      const sampled = sampleForImage(targetEntry, settings)

      setTargetData(sampled)
      setIsTransitioning(true)
      setCurrentIndex(index)
    },
    [isTransitioning, currentIndex, images, sampleForImage, settings]
  )

  const handleTransitionComplete = useCallback(() => {
    if (targetData) {
      setCurrentData(targetData)
      setTargetData(null)
      setIsTransitioning(false)
    }
  }, [targetData])

  // Debounce settings changes that require re-sampling
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevSamplingKey = useRef("")

  const handleSettingsChange = useCallback(
    (next: ParticleSettings) => {
      setSettings(next)

      // Check if any sampling-relevant settings changed
      const newKey = `${next.rows}x${next.cols}__h${next.heightScale}`

      if (newKey !== prevSamplingKey.current && images.length > 0) {
        prevSamplingKey.current = newKey

        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => {
          const entry = images[currentIndex]
          if (entry) {
            const sampled = sampleForImage(entry, next)
            setCurrentData(sampled)
          }
        }, 300)
      }
    },
    [images, currentIndex, sampleForImage]
  )

  // Initialize the sampling key
  useEffect(() => {
    prevSamplingKey.current = `${settings.rows}x${settings.cols}__h${settings.heightScale}`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") handleNavigate("prev")
      else if (e.key === "ArrowRight") handleNavigate("next")
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleNavigate])

  return (
    <div className="relative h-screen w-full bg-background">
      {loading && <LoadingIndicator />}

      <Canvas
        camera={{ position: [0, 0, 12], fov: 50 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false, preserveDrawingBuffer: true }}
        style={{
          opacity: loading ? 0 : 1,
          transition: "opacity 1.5s ease-in",
        }}
      >
        <color attach="background" args={["#000000"]} />
        <GradientBackground color1={settings.bgColor1} color2={settings.bgColor2} />
        <MouseTracker mousePosRef={mousePosRef} mouseActivityRef={mouseActivityRef} />

        <Suspense fallback={null}>
          {currentData && (
            <ParticleCloud
              key={currentData.count}
              data={currentData}
              speed={settings.speed}
              range={settings.range}
              sizeMul={settings.size}
              sizeMin={settings.sizeMin}
              sizeMax={settings.sizeMax}
              opacityPulse={settings.opacityPulse}
              opacitySpeed={settings.opacitySpeed}
              opacityRange={settings.opacityRange}
              mousePosRef={mousePosRef}
              mouseActivityRef={mouseActivityRef}
              highlightColor={settings.highlightColor}
              highlightRadius={settings.highlightRadius}
              targetData={targetData}
              onTransitionComplete={handleTransitionComplete}
              particleShape={settings.particleShape ?? "egg"}
              shapeWaveDuration={settings.shapeWaveDuration ?? 0.8}
            />
          )}
        </Suspense>

        <OrbitControls
          enableZoom
          enablePan={false}
          minDistance={5}
          maxDistance={20}
          autoRotate={settings.rotateSpeed > 0}
          autoRotateSpeed={settings.rotateSpeed}
          dampingFactor={0.05}
          enableDamping
        />
      </Canvas>

      {!loading && (
        <>
          <Title />

          <ControlsPanel
            settings={settings}
            onSettingsChange={handleSettingsChange}
            onImagesAdd={handleImagesAdd}
            onImageRemove={handleImageRemove}
            images={images}
            currentIndex={currentIndex}
            onNavigate={handleNavigate}
            onJumpTo={handleJumpTo}
            isTransitioning={isTransitioning}
            particleCount={currentData?.count ?? 0}
            presets={presets}
            onSavePreset={handleSavePreset}
            onLoadPreset={handleLoadPreset}
            onDeletePreset={handleDeletePreset}
          />

          <div className="absolute bottom-8 right-8">
            <p className="font-mono text-[10px] text-muted-foreground/40 tracking-wider">
              Drag to orbit / Scroll to zoom / Arrow keys to navigate
            </p>
          </div>
        </>
      )}
    </div>
  )
}
