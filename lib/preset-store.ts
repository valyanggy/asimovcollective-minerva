import type { ParticleSettings } from "@/components/controls-panel"

export interface PresetImageData {
  name: string
  dataUrl: string
  thumbnail: string
}

export interface Preset {
  id: string
  name: string
  settings: ParticleSettings
  images: PresetImageData[]
  createdAt: number
}

const DB_NAME = "particle-dither-presets"
const DB_VERSION = 1
const STORE_NAME = "presets"

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function savePreset(preset: Preset): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite")
    tx.objectStore(STORE_NAME).put(preset)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function loadPresets(): Promise<Preset[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly")
    const request = tx.objectStore(STORE_NAME).getAll()
    request.onsuccess = () => {
      const presets = request.result as Preset[]
      presets.sort((a, b) => a.createdAt - b.createdAt)
      resolve(presets)
    }
    request.onerror = () => reject(request.error)
  })
}

export async function deletePreset(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite")
    tx.objectStore(STORE_NAME).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/**
 * Convert an ImageData + canvas to a data URL for storage.
 */
export function imageDataToDataUrl(imgData: ImageData): string {
  const canvas = document.createElement("canvas")
  canvas.width = imgData.width
  canvas.height = imgData.height
  const ctx = canvas.getContext("2d")!
  ctx.putImageData(imgData, 0, 0)
  return canvas.toDataURL("image/png")
}

/**
 * Convert a data URL back to ImageData.
 */
export function dataUrlToImageData(dataUrl: string): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext("2d")!
      ctx.drawImage(img, 0, 0)
      resolve(ctx.getImageData(0, 0, canvas.width, canvas.height))
    }
    img.onerror = reject
    img.src = dataUrl
  })
}
