"use client"

import type { CSSProperties } from "react"

const matrixColors = [
  "#E5B74D", "#11196F", "#E5B74D", "#2D3CAE", "#E5B74D", "#2D3CAE", "#11196F", "#E5B74D", "#E5B74D", 
  "#E5B74D", "#E5B74D", "#E5B74D", "#2D3CAE", "#E5B74D", "#2D3CAE", "#11196F", "#E5B74D", "#E5B74D", 
  "#2D3CAE", "#2D3CAE", "#2D3CAE", "#E5B74D", "#2D3CAE", "#E5B74D", "#2D3CAE", "#E5B74D", "#E5B74D", "#2D3CAE",
  "#E5B74D", "#E5B74D", "#2D3CAE", "#2D3CAE", "#E5B74D", "#E5B74D", "#E5B74D", "#2D3CAE", "#2D3CAE", "#E5B74D",
  "#E5B74D", "#11196F", "#E5B74D", "#E5B74D", "#2D3CAE", "#E5B74D", "#11196F", "#11196F", "#11196F", "#2D3CAE",
  "#11196F", "#11196F", "#E5B74D", "#E5B74D", "#E5B74D", "#2D3CAE", "#E5B74D", "#2D3CAE", "#2D3CAE", "#E5B74D",
  "#E5B74D", "#2D3CAE", "#E5B74D", "#E5B74D", "#E5B74D", "#E5B74D", "#E5B74D", "#E5B74D", "#E5B74D", "#E5B74D",
  "#E5B74D", "#E5B74D", "#11196F", "#2D3CAE", "#E5B74D", "#2D3CAE", "#E5B74D", "#11196F", "#2D3CAE", "#E5B74D",
  "#2D3CAE", "#2D3CAE", "#11196F", "#11196F", "#E5B74D", "#E5B74D", "#2D3CAE", "#E5B74D", "#E5B74D", "#E5B74D",
 
]

const journeyParticles = [
  { route: "left", duration: "4.9s", delay: "-0.4s" },
  { route: "left", duration: "6.2s", delay: "-2.2s" },
  { route: "left", duration: "5.4s", delay: "-3.4s" },
  { route: "left", duration: "7.1s", delay: "-1.6s" },
  { route: "right-user", duration: "5.8s", delay: "-0.9s" },
  { route: "right-user", duration: "4.7s", delay: "-3.1s" },
  { route: "right-life", duration: "6.8s", delay: "-2.4s" },
  { route: "right-life", duration: "5.2s", delay: "-4.2s" },
] as const

export function JourneyMappingAnimation() {
  return (
    <div className="journey-map" aria-label="Journey mapping animation">
      <div className="journey-map__stage">
        <svg className="journey-map__lines" viewBox="0 0 1280 360" role="presentation">
          <path className="journey-map__line" d="M210 180H490" />
          <path className="journey-map__line journey-map__line--dashed" d="M490 180H520" />
          <path className="journey-map__line" d="M780 180H1020" />
          <path className="journey-map__tick" d="M310 166V194" />
          <path className="journey-map__tick" d="M342 166V194" />
          <path className="journey-map__tick" d="M374 166V194" />
          <path className="journey-map__tick" d="M406 166V194" />
        </svg>

        {journeyParticles.map((particle, index) => (
          <span
            className={`journey-map__particle journey-map__particle--${particle.route}`}
            key={`${particle.route}-${index}`}
            style={{
              "--particle-duration": particle.duration,
              "--particle-delay": particle.delay,
            } as CSSProperties}
          />
        ))}

        <div className="journey-map__pill journey-map__pill--source">
          <span>ENRICHED AUDIENCE 1</span>
          <i />
        </div>

        <div className="journey-map__engine">
          <div className="journey-map__title">AGENTIC DATA ENGINEER</div>
          <div className="journey-map__matrix">
            {matrixColors.slice(0, 81).map((color, index) => (
              <i
                key={`${color}-${index}`}
                style={{
                  "--dot-base": color,
                  "--dot-delay": `${(index % 17) * -0.13}s`,
                  "--dot-duration": `${1.2 + (index % 5) * 0.18}s`,
                } as CSSProperties}
              />
            ))}
          </div>
        </div>

        <div className="journey-map__wipe journey-map__wipe--user">MAPPING USER JOURNEY...</div>
        <div className="journey-map__wipe journey-map__wipe--life">MAPPING LIFE JOURNEY...</div>

        <div className="journey-map__pill journey-map__pill--result">
          <i />
          <span>STANDARDIZED SEGMENT</span>
        </div>
      </div>
    </div>
  )
}
