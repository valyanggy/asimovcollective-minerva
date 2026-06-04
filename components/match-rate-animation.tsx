"use client"

import type { CSSProperties } from "react"

const palette = {
  gold: "#E5B74D",
  blue: "#2D3CAE",
  navy: "#11196F",
  black: "#050505",
}

const matrixProfiles = [
  {
    id: "low",
    count: 64,
    columns: 8,
    dotSize: "12px",
    colors: [palette.blue, palette.navy, palette.blue, palette.navy, palette.blue, palette.gold],
  },
  {
    id: "mixed",
    count: 144,
    columns: 12,
    dotSize: "9.5px",
    colors: [
      palette.blue,
      palette.gold,
      palette.blue,
      palette.gold,
      palette.navy,
      palette.gold,
      palette.gold,
      palette.blue,
    ],
  },
  {
    id: "high",
    count: 256,
    columns: 16,
    dotSize: "7.5px",
    colors: [
      palette.gold,
      palette.gold,
      palette.gold,
      palette.gold,
      palette.gold,
      palette.gold,
      palette.gold,
      palette.gold,
      palette.gold,
      palette.gold,
      palette.gold,
      palette.gold,
      palette.gold,
      palette.gold,
      palette.gold,
      palette.gold,
      palette.blue,
      palette.gold,
      palette.gold,
      palette.gold,
      palette.gold,
      palette.gold,
      palette.navy,
      palette.gold,
      palette.gold,
      palette.gold,
    ],
  },
] as const

function buildDots(colors: readonly string[], count = 90) {
  return Array.from({ length: count }, (_, index) => colors[index % colors.length])
}

export function MatchRateAnimation() {
  return (
    <div className="match-rate" aria-label="Match rate animation">
      <div className="match-rate__stage">
        <h2>INCREASE MATCH RATE BY UP TO 15%</h2>

        <div className="match-rate__frame">
          <div className="match-rate__labels">
            <span>LOW RESOLUTION</span>
            <i />
            <span>HIGH RESOLUTION</span>
          </div>

          <div className="match-rate__matrices">
            {matrixProfiles.map((profile, profileIndex) => (
              <div
                className={`match-rate__matrix match-rate__matrix--${profile.id}`}
                key={profile.id}
                style={
                  {
                    "--matrix-columns": profile.columns,
                    "--matrix-dot-size": profile.dotSize,
                  } as CSSProperties
                }
              >
                {buildDots(profile.colors, profile.count).map((color, index) => (
                  <i
                    key={`${profile.id}-${index}`}
                    style={{
                      "--dot-base": color,
                      "--dot-delay": `${(index % 19) * -0.11 - profileIndex * 0.18}s`,
                      "--dot-duration": `${1.15 + ((index + profileIndex) % 6) * 0.16}s`,
                    } as CSSProperties}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
