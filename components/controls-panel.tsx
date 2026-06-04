"use client"

import React from "react"
import { useState, useCallback, useRef } from "react"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Settings,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Trash2,
  Save,
  FolderOpen,
  X,
} from "lucide-react"
import type { Preset } from "@/lib/preset-store"

export interface ParticleSettings {
  rows: number
  cols: number
  size: number
  sizeMin: number
  sizeMax: number
  speed: number
  range: number
  heightScale: number
  rotateSpeed: number
  opacityPulse: boolean
  opacitySpeed: number
  opacityRange: number
  bgColor1: string
  bgColor2: string
  highlightColor: string
  highlightRadius: number
  colors: [string, string, string, string, string, string] // 6 hex colors
  particleShape: "rectangle" | "egg"
  shapeWaveDuration: number // 0-2 seconds for wave spread
}

export const DEFAULT_COLORS: [string, string, string, string, string, string] = [
  "#115cdd", // Deepest - blue
  "#ffffff", // Deep Shadow - white
  "#ffa200", // Shadow - orange
  "#5b94b5", // Midtone - light blue
  "#7da87a", // Light - sage green
  "#05327a", // Highlight - dark blue
]

export interface ImageEntry {
  id: string
  name: string
  data: ImageData
  thumbnail: string
}

interface ControlsPanelProps {
  settings: ParticleSettings
  onSettingsChange: (settings: ParticleSettings) => void
  onImagesAdd: (entries: ImageEntry[]) => void
  onImageRemove: (id: string) => void
  images: ImageEntry[]
  currentIndex: number
  onNavigate: (direction: "prev" | "next") => void
  onJumpTo: (index: number) => void
  isTransitioning: boolean
  particleCount: number
  presets: Preset[]
  onSavePreset: (name: string) => void
  onLoadPreset: (preset: Preset) => void
  onDeletePreset: (id: string) => void
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
  displayValue,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
  displayValue?: string
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Label className="font-mono text-[11px] text-muted-foreground tracking-wider uppercase">
          {label}
        </Label>
        <span className="font-mono text-[11px] text-foreground tabular-nums">
          {displayValue ?? value}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
        className="w-full"
      />
    </div>
  )
}

function NumberInput({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="font-mono text-[11px] text-muted-foreground tracking-wider uppercase">
        {label}
      </Label>
      <Input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => {
          const v = parseInt(e.target.value, 10)
          if (!isNaN(v) && v >= min && v <= max) onChange(v)
        }}
        className="h-8 font-mono text-xs bg-secondary/50 border-border tabular-nums"
      />
    </div>
  )
}

function ColorInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (hex: string) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded border border-border">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute -inset-1 h-8 w-8 cursor-pointer border-none p-0"
        />
      </div>
      <span className="font-mono text-[10px] text-muted-foreground tracking-wider uppercase">
        {label}
      </span>
      <span className="ml-auto font-mono text-[10px] text-muted-foreground/60 tabular-nums">
        {value}
      </span>
    </div>
  )
}

function processImageFile(file: File): Promise<ImageEntry> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => {
        const canvas = document.createElement("canvas")
        const maxSize = 512
        const scale = Math.min(maxSize / img.width, maxSize / img.height)
        canvas.width = img.width * scale
        canvas.height = img.height * scale

        const ctx = canvas.getContext("2d")!
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

        const thumbCanvas = document.createElement("canvas")
        thumbCanvas.width = 48
        thumbCanvas.height = 48
        const thumbCtx = thumbCanvas.getContext("2d")!
        const thumbScale = Math.max(48 / img.width, 48 / img.height)
        const tw = img.width * thumbScale
        const th = img.height * thumbScale
        thumbCtx.drawImage(img, (48 - tw) / 2, (48 - th) / 2, tw, th)

        resolve({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: file.name,
          data: imageData,
          thumbnail: thumbCanvas.toDataURL("image/jpeg", 0.6),
        })
      }
      img.onerror = reject
      img.src = reader.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function ControlsPanel({
  settings,
  onSettingsChange,
  onImagesAdd,
  onImageRemove,
  images,
  currentIndex,
  onNavigate,
  onJumpTo,
  isTransitioning,
  particleCount,
  presets,
  onSavePreset,
  onLoadPreset,
  onDeletePreset,
}: ControlsPanelProps) {
  const [open, setOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [showSaveInput, setShowSaveInput] = useState(false)
  const [presetName, setPresetName] = useState("")
  const [loadingPresetId, setLoadingPresetId] = useState<string | null>(null)

  const update = useCallback(
    (key: keyof ParticleSettings, value: ParticleSettings[keyof ParticleSettings]) => {
      onSettingsChange({ ...settings, [key]: value })
    },
    [settings, onSettingsChange]
  )

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? [])
      if (files.length === 0) return

      setUploading(true)
      try {
        const entries = await Promise.all(files.map(processImageFile))
        onImagesAdd(entries)
      } catch {
        // silently fail
      } finally {
        setUploading(false)
        e.target.value = ""
      }
    },
    [onImagesAdd]
  )

  const hasMultiple = images.length > 1

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className="absolute top-8 right-8 z-20 flex items-center gap-2 rounded-md border border-border bg-card/80 px-3 py-2 backdrop-blur-sm transition-colors hover:bg-secondary"
        aria-label="Toggle controls"
      >
        <Settings className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="font-mono text-[11px] text-muted-foreground tracking-wider uppercase">
          Controls
        </span>
      </button>

      {/* Nav buttons + Shape toggle */}
      <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 items-center gap-4">
        {/* Shape toggle */}
        <div className="flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-2 backdrop-blur-sm">
          <span className={`font-mono text-[10px] tracking-wider uppercase transition-colors ${
            (settings.particleShape ?? "egg") === "rectangle" ? "text-foreground" : "text-muted-foreground"
          }`}>
            Rect
          </span>
          <button
            onClick={() => update("particleShape", (settings.particleShape ?? "egg") === "egg" ? "rectangle" : "egg")}
            className="relative h-5 w-9 rounded-full border border-border bg-secondary transition-colors"
            aria-label="Toggle particle shape"
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-primary transition-transform ${
                (settings.particleShape ?? "egg") === "egg" ? "translate-x-4" : "translate-x-0.5"
              }`}
            />
          </button>
          <span className={`font-mono text-[10px] tracking-wider uppercase transition-colors ${
            (settings.particleShape ?? "egg") === "egg" ? "text-foreground" : "text-muted-foreground"
          }`}>
            Egg
          </span>
        </div>

        {/* Image navigation */}
        {hasMultiple && (
          <>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate("prev")}
                disabled={isTransitioning}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card/80 backdrop-blur-sm transition-colors hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-4 w-4 text-foreground" />
              </button>
              <span className="font-mono text-xs text-muted-foreground tabular-nums tracking-wider">
                {currentIndex + 1} / {images.length}
              </span>
              <button
                onClick={() => onNavigate("next")}
                disabled={isTransitioning}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card/80 backdrop-blur-sm transition-colors hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Next image"
              >
                <ChevronRight className="h-4 w-4 text-foreground" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Panel */}
      <div
        className={`absolute top-20 right-8 z-20 max-h-[calc(100vh-7rem)] w-72 overflow-y-auto rounded-lg border border-border bg-card/90 backdrop-blur-md transition-all duration-300 ${
          open
            ? "translate-x-0 opacity-100 pointer-events-auto"
            : "translate-x-4 opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex flex-col gap-4 p-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="font-mono text-xs text-foreground tracking-widest uppercase">
              Settings
            </h2>
            <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
              {particleCount.toLocaleString()} pts
            </span>
          </div>

          <div className="h-px bg-border" />

          {/* Presets */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <Label className="font-mono text-[11px] text-muted-foreground tracking-wider uppercase">
                Presets
              </Label>
              <button
                onClick={() => {
                  setShowSaveInput(true)
                  setPresetName(`Preset ${presets.length + 1}`)
                }}
                className="flex items-center gap-1.5 rounded border border-border bg-secondary/50 px-2 py-1 transition-colors hover:bg-secondary"
                aria-label="Save preset"
              >
                <Save className="h-3 w-3 text-muted-foreground" />
                <span className="font-mono text-[10px] text-muted-foreground tracking-wider">
                  Save
                </span>
              </button>
            </div>

            {showSaveInput && (
              <div className="flex gap-2">
                <Input
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && presetName.trim()) {
                      onSavePreset(presetName.trim())
                      setShowSaveInput(false)
                      setPresetName("")
                    } else if (e.key === "Escape") {
                      setShowSaveInput(false)
                    }
                  }}
                  placeholder="Preset name..."
                  className="h-7 flex-1 font-mono text-[11px] bg-secondary/50 border-border"
                  autoFocus
                />
                <button
                  onClick={() => {
                    if (presetName.trim()) {
                      onSavePreset(presetName.trim())
                      setShowSaveInput(false)
                      setPresetName("")
                    }
                  }}
                  className="flex h-7 items-center rounded border border-border bg-primary/20 px-2 transition-colors hover:bg-primary/30"
                >
                  <Save className="h-3 w-3 text-foreground" />
                </button>
                <button
                  onClick={() => setShowSaveInput(false)}
                  className="flex h-7 items-center rounded border border-border bg-secondary/50 px-2 transition-colors hover:bg-secondary"
                >
                  <X className="h-3 w-3 text-muted-foreground" />
                </button>
              </div>
            )}

            {presets.length > 0 && (
              <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                {presets.map((p) => (
                  <div
                    key={p.id}
                    className="group flex items-center gap-2 rounded border border-border bg-secondary/30 px-2.5 py-1.5 transition-colors hover:bg-secondary/60"
                  >
                    <FolderOpen className="h-3 w-3 shrink-0 text-muted-foreground" />
                    <button
                      onClick={async () => {
                        setLoadingPresetId(p.id)
                        await onLoadPreset(p)
                        setLoadingPresetId(null)
                      }}
                      className="flex-1 text-left font-mono text-[11px] text-foreground tracking-wider truncate hover:text-primary transition-colors"
                    >
                      {p.name}
                    </button>
                    {loadingPresetId === p.id && (
                      <div className="h-3 w-3 animate-spin rounded-full border border-muted-foreground border-t-primary" />
                    )}
                    <span className="font-mono text-[9px] text-muted-foreground/50 tabular-nums shrink-0">
                      {p.images.length} img
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeletePreset(p.id)
                      }}
                      className="hidden h-4 w-4 shrink-0 items-center justify-center rounded-full bg-destructive/80 text-destructive-foreground group-hover:flex transition-colors hover:bg-destructive"
                      aria-label={`Delete ${p.name}`}
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {presets.length === 0 && !showSaveInput && (
              <p className="font-mono text-[9px] text-muted-foreground/50 tracking-wider">
                No saved presets yet.
              </p>
            )}
          </div>

          <div className="h-px bg-border" />

          {/* Grid controls */}
          <SliderRow
            label="Grid Rows"
            value={settings.rows}
            min={10}
            max={400}
            step={1}
            onChange={(v) => update("rows", v)}
            displayValue={`${settings.rows}`}
          />

          <SliderRow
            label="Grid Columns"
            value={settings.cols}
            min={10}
            max={400}
            step={1}
            onChange={(v) => update("cols", v)}
            displayValue={`${settings.cols}`}
          />

          <div className="h-px bg-border" />

          {/* Sliders */}
          <SliderRow
            label="Dot Size"
            value={settings.size}
            min={0.2}
            max={20}
            step={0.1}
            onChange={(v) => update("size", v)}
            displayValue={`${settings.size.toFixed(1)}x`}
          />

          <SliderRow
            label="Pulse Size Min"
            value={settings.sizeMin}
            min={0}
            max={2}
            step={0.01}
            onChange={(v) => update("sizeMin", v)}
            displayValue={`${settings.sizeMin.toFixed(2)}x`}
          />

          <SliderRow
            label="Pulse Size Max"
            value={settings.sizeMax}
            min={0.5}
            max={4}
            step={0.01}
            onChange={(v) => update("sizeMax", v)}
            displayValue={`${settings.sizeMax.toFixed(2)}x`}
          />

          <SliderRow
            label="Height Bump"
            value={settings.heightScale}
            min={0}
            max={24}
            step={0.1}
            onChange={(v) => update("heightScale", v)}
            displayValue={`${settings.heightScale.toFixed(1)}`}
          />

          <SliderRow
            label="Size Pulse Speed"
            value={settings.speed}
            min={0}
            max={4}
            step={0.05}
            onChange={(v) => update("speed", v)}
            displayValue={`${settings.speed.toFixed(2)}x`}
          />

          <SliderRow
            label="Size Pulse Range"
            value={settings.range}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => update("range", v)}
            displayValue={`${(settings.range * 100).toFixed(0)}%`}
          />

          <SliderRow
            label="Rotate Speed"
            value={settings.rotateSpeed}
            min={0}
            max={5}
            step={0.05}
            onChange={(v) => update("rotateSpeed", v)}
            displayValue={settings.rotateSpeed === 0 ? "Off" : `${settings.rotateSpeed.toFixed(2)}x`}
          />

          <div className="h-px bg-border" />

          <SliderRow
            label="Shape Wave Duration"
            value={settings.shapeWaveDuration ?? 0.8}
            min={0}
            max={2}
            step={0.05}
            onChange={(v) => update("shapeWaveDuration", v)}
            displayValue={(settings.shapeWaveDuration ?? 0.8) === 0 ? "Instant" : `${(settings.shapeWaveDuration ?? 0.8).toFixed(2)}s`}
          />

          <div className="h-px bg-border" />

          {/* Opacity animation */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <Label className="font-mono text-[11px] text-muted-foreground tracking-wider uppercase">
                Opacity Pulse
              </Label>
              <button
                onClick={() => update("opacityPulse", !settings.opacityPulse)}
                className={`relative h-5 w-9 rounded-full border transition-colors ${
                  settings.opacityPulse
                    ? "bg-primary border-primary"
                    : "bg-secondary border-border"
                }`}
                role="switch"
                aria-checked={settings.opacityPulse}
                aria-label="Toggle opacity pulse"
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-3.5 w-3.5 rounded-full bg-foreground transition-transform ${
                    settings.opacityPulse ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {settings.opacityPulse && (
              <>
                <SliderRow
                  label="Opacity Speed"
                  value={settings.opacitySpeed}
                  min={0.05}
                  max={4}
                  step={0.05}
                  onChange={(v) => update("opacitySpeed", v)}
                  displayValue={`${settings.opacitySpeed.toFixed(2)}x`}
                />
                <SliderRow
                  label="Opacity Range"
                  value={settings.opacityRange}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={(v) => update("opacityRange", v)}
                  displayValue={`${(settings.opacityRange * 100).toFixed(0)}%`}
                />
              </>
            )}
          </div>

          <div className="h-px bg-border" />

          {/* Background gradient */}
          <div className="flex flex-col gap-2.5">
            <Label className="font-mono text-[11px] text-muted-foreground tracking-wider uppercase">
              Background
            </Label>
            <ColorInput
              label="Top"
              value={settings.bgColor1}
              onChange={(v) => update("bgColor1", v)}
            />
            <ColorInput
              label="Bottom"
              value={settings.bgColor2}
              onChange={(v) => update("bgColor2", v)}
            />
          </div>

          <div className="h-px bg-border" />

          {/* Mouse highlight */}
          <div className="flex flex-col gap-2.5">
            <Label className="font-mono text-[11px] text-muted-foreground tracking-wider uppercase">
              Mouse Highlight
            </Label>
            <ColorInput
              label="Color"
              value={settings.highlightColor}
              onChange={(v) => update("highlightColor", v)}
            />
            <SliderRow
              label="Radius"
              value={settings.highlightRadius}
              min={0.5}
              max={6}
              step={0.1}
              onChange={(v) => update("highlightRadius", v)}
              displayValue={`${settings.highlightRadius.toFixed(1)}`}
            />
          </div>

          <div className="h-px bg-border" />

          {/* Image Gallery */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Label className="font-mono text-[11px] text-muted-foreground tracking-wider uppercase">
                Images ({images.length})
              </Label>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-1.5 rounded border border-border bg-secondary/50 px-2 py-1 transition-colors hover:bg-secondary disabled:opacity-50"
                aria-label="Add images"
              >
                {uploading ? (
                  <div className="h-3 w-3 animate-spin rounded-full border border-muted-foreground border-t-primary" />
                ) : (
                  <ImagePlus className="h-3 w-3 text-muted-foreground" />
                )}
                <span className="font-mono text-[10px] text-muted-foreground tracking-wider">
                  Add
                </span>
              </button>
            </div>

            {images.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {images.map((img, idx) => (
                  <div key={img.id} className="group relative">
                    <button
                      onClick={() => {
                        if (idx !== currentIndex && !isTransitioning) {
                          onJumpTo(idx)
                        }
                      }}
                      className={`h-11 w-11 overflow-hidden rounded border-2 transition-all ${
                        idx === currentIndex
                          ? "border-primary ring-1 ring-primary/30"
                          : "border-border opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={img.thumbnail || "/placeholder.svg"}
                        alt={img.name}
                        className="h-full w-full object-cover"
                      />
                    </button>
                    {images.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onImageRemove(img.id)
                        }}
                        className="absolute -top-1.5 -right-1.5 hidden h-4 w-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground group-hover:flex"
                        aria-label={`Remove ${img.name}`}
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            <p className="font-mono text-[9px] text-muted-foreground/60 tracking-wider">
              Upload images. Use arrows to transition.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
