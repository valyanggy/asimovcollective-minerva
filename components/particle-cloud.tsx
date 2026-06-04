"use client"

import type React from "react"
import { useRef, useMemo, useEffect, useCallback } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import type { ParticleData } from "@/lib/image-sampler"

const vertexShader = `
  attribute float aSize;
  attribute float aOffset;
  attribute float aGroup;
  attribute vec2 aGridUV; // normalized grid position (0-1)

  attribute vec3 aTargetPosition;
  attribute vec3 aTargetColor;
  attribute float aTargetSize;
  attribute float aTargetGroup;

  varying vec3 vColor;
  varying float vGroup;
  varying float vOpacity;
  varying float vHighlight;
  varying float vShapeMorphDelay; // per-particle delay for shape morph

  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uSpeed;
  uniform float uRange;
  uniform float uSizeMul;
  uniform float uSizeMin;
  uniform float uSizeMax;
  uniform float uTransition; // 0-1 raw transition progress
  uniform float uTransitionWaveSpread; // how spread out the wave is
  uniform float uOpacityPulse;
  uniform float uOpacitySpeed;
  uniform float uOpacityRange;

  uniform vec3 uMousePos;
  uniform float uMouseActivity; // 0 = idle, 1 = active movement
  uniform float uHighlightRadius;

  void main() {
    // Calculate wave delay based on grid position (top-left to bottom-right)
    float waveDelay = (aGridUV.x + aGridUV.y) * 0.5; // 0 at top-left, 1 at bottom-right
    vShapeMorphDelay = waveDelay;
    
    // Image transition with wave effect
    // uTransition goes 0 -> 1
    // We want: shrink wave (0->0.5), then grow wave (0.5->1)
    // Each particle has a delayed start based on waveDelay
    float waveProgress = uTransition * uTransitionWaveSpread;
    float localProgress = clamp(waveProgress - waveDelay * (uTransitionWaveSpread - 1.0), 0.0, 1.0);
    
    // Scale effect: 1 -> 0 -> 1 (shrink then grow)
    // First half (0-0.5): shrink from 1 to 0
    // Second half (0.5-1): grow from 0 to 1
    float scaleT = localProgress * 2.0;
    float transitionScale = scaleT < 1.0 ? (1.0 - scaleT) : (scaleT - 1.0);
    
    // Color/data blend: switch at the midpoint of each particle's local transition
    float dataBlend = localProgress < 0.5 ? 0.0 : 1.0;
    
    vec3 basePos = mix(position, aTargetPosition, dataBlend);
    vec3 baseColor = mix(color, aTargetColor, dataBlend);
    float baseSize = mix(aSize, aTargetSize, dataBlend);
    float baseGroup = mix(aGroup, aTargetGroup, dataBlend);

    vColor = baseColor;
    vGroup = baseGroup;

    // Size pulse
    float groupSpeed = 1.0 + baseGroup * 0.25;
    float t = uTime * uSpeed * groupSpeed + aOffset;
    float pulse = sin(t * 0.8) * 0.5 + 0.5;
    float sizePulse = mix(uSizeMin, uSizeMax, pulse * uRange + (1.0 - uRange));

    // Opacity pulse
    float opT = uTime * uOpacitySpeed * (1.0 + baseGroup * 0.2) + aOffset * 1.7;
    float opPulse = sin(opT * 0.6) * 0.5 + 0.5;
    vOpacity = mix(1.0, mix(1.0, opPulse, uOpacityRange), uOpacityPulse);

    // Mouse highlight: soft circular proximity, fades with activity
    float mouseDist = length(basePos.xy - uMousePos.xy);
    float proximity = smoothstep(uHighlightRadius, 0.0, mouseDist);
    vHighlight = proximity * uMouseActivity;

    vec4 mvPosition = modelViewMatrix * vec4(basePos, 1.0);

    // Apply transition scale to point size
    gl_PointSize = baseSize * uSizeMul * sizePulse * transitionScale * uPixelRatio * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const fragmentShader = `
  varying vec3 vColor;
  varying float vGroup;
  varying float vOpacity;
  varying float vHighlight;
  varying float vShapeMorphDelay;

  uniform vec3 uHighlightColor;
  uniform float uShapeMorph; // 0 = rectangle, 1 = egg
  uniform float uWaveSpread; // controls how spread out the wave is

  void main() {
    vec2 uv = gl_PointCoord - vec2(0.5);
    
    // Calculate per-particle morph progress with wave delay
    // localMorph: 0 = show rectangle (egg scaled huge), 1 = show egg (natural size)
    float localMorph = clamp((uShapeMorph * uWaveSpread - vShapeMorphDelay * (uWaveSpread - 1.0)), 0.0, 1.0);
    
    // HARD rectangle boundary - nothing renders outside this
    float rectDist = max(abs(uv.x), abs(uv.y));
    if (rectDist > 0.48) discard;
    
    // Egg shape calculation
    // The egg is drawn INSIDE the rectangle frame
    // eggScale controls how big the egg appears:
    // - localMorph=0 (rectangle mode): eggScale=0.15, egg is scaled up ~6.7x, fills entire frame
    // - localMorph=1 (egg mode): eggScale=0.85, egg fits nicely inside the frame
    float eggScale = mix(0.15, 0.85, localMorph);
    
    // Scale UV to zoom into the egg
    vec2 scaledUv = uv / eggScale;
    
    // Egg shape math
    float yShifted = scaledUv.y - 0.03;
    float t = yShifted + 0.5;
    float squeeze = 0.85 + 0.3 * t * t;
    vec2 eggUv = vec2(scaledUv.x / squeeze, yShifted);
    vec2 eggScaled = vec2(eggUv.x * 1.05, eggUv.y * 0.88);
    float eggDist = length(eggScaled);
    
    // Egg alpha: 1 inside the egg, 0 outside
    // Use a slightly softer edge for the egg itself
    float eggAlpha = 1.0 - smoothstep(0.4, 0.48, eggDist);
    
    // Final alpha is just the egg (clipped by the hard rect boundary above)
    float alpha = eggAlpha * vOpacity;
    
    // Discard transparent pixels
    if (alpha < 0.01) discard;

    // Blend toward highlight color based on mouse proximity and activity
    vec3 finalColor = mix(vColor, uHighlightColor, vHighlight * 0.85);

    gl_FragColor = vec4(finalColor, alpha);
  }
`

interface ParticleCloudProps {
  data: ParticleData
  speed: number
  range: number
  sizeMul: number
  sizeMin: number
  sizeMax: number
  opacityPulse: boolean
  opacitySpeed: number
  opacityRange: number
  mousePosRef: React.MutableRefObject<THREE.Vector3>
  mouseActivityRef: React.MutableRefObject<number>
  highlightColor: string
  highlightRadius: number
  targetData: ParticleData | null
  onTransitionComplete: () => void
  particleShape: "rectangle" | "egg"
  shapeWaveDuration: number
}

export function ParticleCloud({
  data,
  speed,
  range,
  sizeMul,
  sizeMin,
  sizeMax,
  opacityPulse,
  opacitySpeed,
  opacityRange,
  mousePosRef,
  mouseActivityRef,
  highlightColor,
  highlightRadius,
  targetData,
  onTransitionComplete,
  particleShape,
  shapeWaveDuration,
}: ParticleCloudProps) {
  const pointsRef = useRef<THREE.Points>(null)
  const transitionRef = useRef(0)
  const isTransitioning = useRef(false)
  const bakeScheduled = useRef(false)
  const onTransitionCompleteRef = useRef(onTransitionComplete)
  onTransitionCompleteRef.current = onTransitionComplete
  
  // Shape morph state
  const shapeMorphRef = useRef(particleShape === "egg" ? 1.0 : 0.0)
  const targetShapeMorphRef = useRef(particleShape === "egg" ? 1.0 : 0.0)

  const count = data.count

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: {
        value:
          typeof window !== "undefined"
            ? Math.min(window.devicePixelRatio, 2)
            : 1,
      },
      uSpeed: { value: speed },
      uRange: { value: range },
      uSizeMul: { value: sizeMul },
      uSizeMin: { value: sizeMin },
      uSizeMax: { value: sizeMax },
      uOpacityPulse: { value: opacityPulse ? 1.0 : 0.0 },
      uOpacitySpeed: { value: opacitySpeed },
      uOpacityRange: { value: opacityRange },
      uMousePos: { value: new THREE.Vector3(999, 999, 0) },
      uMouseActivity: { value: 0 },
      uHighlightRadius: { value: highlightRadius },
      uHighlightColor: { value: new THREE.Color(highlightColor) },
      uTransition: { value: 0 },
      uTransitionWaveSpread: { value: 2.0 }, // spread for image transition wave
      uShapeMorph: { value: particleShape === "egg" ? 1.0 : 0.0 },
      uWaveSpread: { value: shapeWaveDuration > 0 ? 1.0 + shapeWaveDuration : 1.0 },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  // Pre-allocate all attribute arrays at fixed size
  const buffers = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    const siz = new Float32Array(count)
    const off = new Float32Array(count)
    const grp = new Float32Array(count)
    const gridUV = new Float32Array(count * 2) // normalized grid position
    const tPos = new Float32Array(count * 3)
    const tCol = new Float32Array(count * 3)
    const tSiz = new Float32Array(count)
    const tGrp = new Float32Array(count)

    pos.set(data.positions)
    col.set(data.colors)
    siz.set(data.sizes)
    off.set(data.offsets)
    grp.set(data.groups)
    
    // Calculate grid UV from positions (normalized to 0-1 range)
    // Find min/max bounds
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
    for (let i = 0; i < count; i++) {
      const x = data.positions[i * 3]
      const y = data.positions[i * 3 + 1]
      minX = Math.min(minX, x)
      maxX = Math.max(maxX, x)
      minY = Math.min(minY, y)
      maxY = Math.max(maxY, y)
    }
    const rangeX = maxX - minX || 1
    const rangeY = maxY - minY || 1
    
    for (let i = 0; i < count; i++) {
      const x = data.positions[i * 3]
      const y = data.positions[i * 3 + 1]
      // Normalize to 0-1, with top-left being (0,0) and bottom-right being (1,1)
      // Note: Y is inverted in 3D space (positive Y is up), so we invert it
      gridUV[i * 2] = (x - minX) / rangeX
      gridUV[i * 2 + 1] = 1 - (y - minY) / rangeY // invert Y so top is 0
    }
    
    tPos.set(data.positions)
    tCol.set(data.colors)
    tSiz.set(data.sizes)
    tGrp.set(data.groups)

    return { pos, col, siz, off, grp, gridUV, tPos, tCol, tSiz, tGrp }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count])

  const buildPadded = useCallback(
    (pd: ParticleData) => {
      const p = new Float32Array(count * 3)
      const c = new Float32Array(count * 3)
      const s = new Float32Array(count)
      const g = new Float32Array(count)

      for (let i = 0; i < count; i++) {
        const si = i % pd.count
        p[i * 3] = pd.positions[si * 3]
        p[i * 3 + 1] = pd.positions[si * 3 + 1]
        p[i * 3 + 2] = pd.positions[si * 3 + 2]
        c[i * 3] = pd.colors[si * 3]
        c[i * 3 + 1] = pd.colors[si * 3 + 1]
        c[i * 3 + 2] = pd.colors[si * 3 + 2]
        s[i] = pd.sizes[si]
        g[i] = pd.groups[si]
      }
      return { p, c, s, g }
    },
    [count]
  )

  useEffect(() => {
    if (!targetData || !pointsRef.current) return

    const padded = buildPadded(targetData)
    const geom = pointsRef.current.geometry

    const tPosAttr = geom.getAttribute("aTargetPosition") as THREE.BufferAttribute
    const tColAttr = geom.getAttribute("aTargetColor") as THREE.BufferAttribute
    const tSizeAttr = geom.getAttribute("aTargetSize") as THREE.BufferAttribute
    const tGroupAttr = geom.getAttribute("aTargetGroup") as THREE.BufferAttribute

    ;(tPosAttr.array as Float32Array).set(padded.p)
    tPosAttr.needsUpdate = true
    ;(tColAttr.array as Float32Array).set(padded.c)
    tColAttr.needsUpdate = true
    ;(tSizeAttr.array as Float32Array).set(padded.s)
    tSizeAttr.needsUpdate = true
    ;(tGroupAttr.array as Float32Array).set(padded.g)
    tGroupAttr.needsUpdate = true

    transitionRef.current = 0
    isTransitioning.current = true
  }, [targetData, buildPadded])

  useFrame((state, delta) => {
    if (!pointsRef.current) return
    const material = pointsRef.current.material as THREE.ShaderMaterial
    material.uniforms.uTime.value = state.clock.elapsedTime
    material.uniforms.uSpeed.value = speed
    material.uniforms.uRange.value = range
    material.uniforms.uSizeMul.value = sizeMul
    material.uniforms.uSizeMin.value = sizeMin
    material.uniforms.uSizeMax.value = sizeMax
    material.uniforms.uOpacityPulse.value = opacityPulse ? 1.0 : 0.0
    material.uniforms.uOpacitySpeed.value = opacitySpeed
    material.uniforms.uOpacityRange.value = opacityRange

    // Mouse highlight
    material.uniforms.uMousePos.value.copy(mousePosRef.current)
    material.uniforms.uMouseActivity.value = mouseActivityRef.current
    material.uniforms.uHighlightRadius.value = highlightRadius
    material.uniforms.uHighlightColor.value.set(highlightColor)

    // Shape morph animation with wave spread
    // Update wave spread uniform based on duration
    const waveSpread = shapeWaveDuration > 0 ? 1.0 + shapeWaveDuration * 2.0 : 1.0
    material.uniforms.uWaveSpread.value = waveSpread
    
    targetShapeMorphRef.current = particleShape === "egg" ? 1.0 : 0.0
    const morphDiff = targetShapeMorphRef.current - shapeMorphRef.current
    if (Math.abs(morphDiff) > 0.001) {
      // Animate toward target - speed inversely proportional to wave duration
      // Longer wave duration = slower overall animation so wave can spread
      const animSpeed = shapeWaveDuration > 0 ? 1.0 / (0.5 + shapeWaveDuration) : 4.0
      shapeMorphRef.current += morphDiff * Math.min(1, delta * animSpeed)
    } else {
      shapeMorphRef.current = targetShapeMorphRef.current
    }
    material.uniforms.uShapeMorph.value = shapeMorphRef.current

    // Two-phase transition to avoid single-frame blink:
    // Phase 1: transition reaches 1 -> bake target into position buffers, keep uTransition at 1
    // Phase 2 (next frame): reset uTransition to 0, fire callback
    if (bakeScheduled.current) {
      // Phase 2: buffers have been uploaded, safe to reset
      material.uniforms.uTransition.value = 0
      transitionRef.current = 0
      bakeScheduled.current = false
      isTransitioning.current = false
      onTransitionCompleteRef.current()
    } else if (isTransitioning.current) {
      // Use slower transition speed to allow wave to complete
      // The wave spread of 2.0 means the last particle starts at 0.5, so we need full 0-1 range
      transitionRef.current = Math.min(1, transitionRef.current + delta * 0.5)
      // Pass raw transition value - the vertex shader handles per-particle timing
      material.uniforms.uTransition.value = transitionRef.current
      material.uniforms.uTransitionWaveSpread.value = 2.0 // wave spread factor

      if (transitionRef.current >= 1) {
        // Phase 1: bake target data into position buffers, keep transition at 1 this frame
        material.uniforms.uTransition.value = 1

        const geom = pointsRef.current.geometry
        const posAttr = geom.getAttribute("position") as THREE.BufferAttribute
        const colAttr = geom.getAttribute("color") as THREE.BufferAttribute
        const sizeAttr = geom.getAttribute("aSize") as THREE.BufferAttribute
        const groupAttr = geom.getAttribute("aGroup") as THREE.BufferAttribute
        const tPosAttr = geom.getAttribute("aTargetPosition") as THREE.BufferAttribute
        const tColAttr = geom.getAttribute("aTargetColor") as THREE.BufferAttribute
        const tSizeAttr = geom.getAttribute("aTargetSize") as THREE.BufferAttribute
        const tGroupAttr = geom.getAttribute("aTargetGroup") as THREE.BufferAttribute

        ;(posAttr.array as Float32Array).set(tPosAttr.array as Float32Array)
        posAttr.needsUpdate = true
        ;(colAttr.array as Float32Array).set(tColAttr.array as Float32Array)
        colAttr.needsUpdate = true
        ;(sizeAttr.array as Float32Array).set(tSizeAttr.array as Float32Array)
        sizeAttr.needsUpdate = true
        ;(groupAttr.array as Float32Array).set(tGroupAttr.array as Float32Array)
        groupAttr.needsUpdate = true

        // Schedule phase 2 for next frame
        bakeScheduled.current = true
      }
    }
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={buffers.pos} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={buffers.col} itemSize={3} />
        <bufferAttribute attach="attributes-aSize" count={count} array={buffers.siz} itemSize={1} />
        <bufferAttribute attach="attributes-aOffset" count={count} array={buffers.off} itemSize={1} />
        <bufferAttribute attach="attributes-aGroup" count={count} array={buffers.grp} itemSize={1} />
        <bufferAttribute attach="attributes-aGridUV" count={count} array={buffers.gridUV} itemSize={2} />
        <bufferAttribute attach="attributes-aTargetPosition" count={count} array={buffers.tPos} itemSize={3} />
        <bufferAttribute attach="attributes-aTargetColor" count={count} array={buffers.tCol} itemSize={3} />
        <bufferAttribute attach="attributes-aTargetSize" count={count} array={buffers.tSiz} itemSize={1} />
        <bufferAttribute attach="attributes-aTargetGroup" count={count} array={buffers.tGrp} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.NormalBlending}
        vertexColors
      />
    </points>
  )
}

function easeInOutQuart(t: number): number {
  return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2
}
