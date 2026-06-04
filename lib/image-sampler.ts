export interface ParticleData {
  positions: Float32Array
  colors: Float32Array
  sizes: Float32Array
  groups: Float32Array
  offsets: Float32Array
  count: number
}

export interface SampleOptions {
  rows: number
  cols: number
  spread: number
  heightScale: number
}

export function sampleImageToParticles(
  imageData: ImageData,
  options: SampleOptions
): ParticleData {
  const { width, height, data } = imageData
  const { rows, cols, spread, heightScale } = options

  const count = rows * cols
  const aspectRatio = width / height

  const gridWidth = spread * aspectRatio
  const gridHeight = spread
  const cellW = gridWidth / cols
  const cellH = gridHeight / rows

  const positions = new Float32Array(count * 3)
  const colorsArr = new Float32Array(count * 3)
  const sizes = new Float32Array(count)
  const groups = new Float32Array(count)
  const offsets = new Float32Array(count)

  // Uniform dot size slightly smaller than cell so gaps are visible
  const dotSize = Math.min(cellW, cellH) * 0.4

  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / cols)
    const col = i % cols

    // Map grid cell to image pixel coordinate
    const px = Math.min(Math.floor((col / cols) * width), width - 1)
    const py = Math.min(Math.floor((row / rows) * height), height - 1)
    const idx = (py * width + px) * 4

    const r = data[idx] / 255
    const g = data[idx + 1] / 255
    const b = data[idx + 2] / 255
    const lum = 0.299 * r + 0.587 * g + 0.114 * b

    // Position on a strict grid, centered at origin
    const x = col * cellW - gridWidth / 2 + cellW / 2
    const y = -(row * cellH - gridHeight / 2 + cellH / 2)
    // Z height from luminance, exaggerated so shade differences read as relief.
    const shade = 0.5 - lum
    const z = Math.sign(shade) * Math.pow(Math.abs(shade) * 2, 1.55) * heightScale

    positions[i * 3] = x
    positions[i * 3 + 1] = y
    positions[i * 3 + 2] = z

    // 6 luminance bands still drive pulse timing, while color stays image-native.
    let group: number

    if (lum < 1 / 6) {
      group = 0
    } else if (lum < 2 / 6) {
      group = 1
    } else if (lum < 3 / 6) {
      group = 2
    } else if (lum < 4 / 6) {
      group = 3
    } else if (lum < 5 / 6) {
      group = 4
    } else {
      group = 5
    }

    colorsArr[i * 3] = r
    colorsArr[i * 3 + 1] = g
    colorsArr[i * 3 + 2] = b

    groups[i] = group
    sizes[i] = dotSize
    offsets[i] = Math.random() * Math.PI * 2
  }

  return { positions, colors: colorsArr, sizes, groups, offsets, count }
}
