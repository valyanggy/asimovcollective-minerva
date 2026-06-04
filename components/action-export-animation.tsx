"use client"

import type { CSSProperties } from "react"

const actions = [
  { label: "RUN ANALYSIS", y: 50, route: 0 },
  { label: "DEVELOP HYPOTHESIS", y: 126, route: 1 },
  { label: "CREATE CAMPAIGN", y: 208, route: 2 },
  { label: "SIMULATE CAMPAIGN", y: 282, route: 3 },
  { label: "PUSH TO INTEGRATION", y: 361, route: 4 },
  { label: "MONITOR PERFORMANCE", y: 439, route: 5 },
  { label: "GENERATE REPORT", y: 514, route: 6 },
] as const

const exportParticles = [
  { route: "input", duration: "4.4s", delay: "-0.3s" },
  { route: "input", duration: "5.7s", delay: "-2.2s" },
  { route: "input", duration: "6.5s", delay: "-4.1s" },
  { route: "input", duration: "4.9s", delay: "-1.5s" },
  { route: "active-0", duration: "16.8s", delay: "0s" },
  { route: "active-1", duration: "16.8s", delay: "2.4s" },
  { route: "active-2", duration: "16.8s", delay: "4.8s" },
  { route: "active-3", duration: "16.8s", delay: "7.2s" },
  { route: "active-4", duration: "16.8s", delay: "9.6s" },
  { route: "active-5", duration: "16.8s", delay: "12s" },
  { route: "active-6", duration: "16.8s", delay: "14.4s" },
] as const

const activePaths = [
  "M472.959 282.304C472.959 154.179 579.168 50.3123 710.184 50.3123",
  "M472.85 282.426C472.85 195.97 579.503 125.884 711.067 125.884",
  "M473.394 282.304C473.394 241.362 579.603 208.172 710.619 208.172",
  "M473.395 282.304L710.62 282.304",
  "M472.85 282.426C472.85 325.654 579.503 360.698 711.067 360.698",
  "M472.879 282.426C472.879 368.882 579.532 438.969 711.096 438.969",
  "M473.393 282.304C473.393 410.43 579.602 514.296 710.618 514.296",
] as const

export function ActionExportAnimation() {
  return (
    <div className="action-export" aria-label="Action export animation">
      <div className="action-export__stage">
        <img className="action-export__paths" src="/lotties/path-3.svg" alt="" aria-hidden="true" />

        <svg className="action-export__active-lines" viewBox="0 0 944 570" role="presentation">
          {activePaths.map((path, index) => (
            <path
              className={`action-export__active-line action-export__active-line--${index}`}
              d={path}
              key={path}
            />
          ))}
        </svg>

        {exportParticles.map((particle, index) => (
          <span
            className={`action-export__particle action-export__particle--${particle.route}`}
            key={`${particle.route}-${index}`}
            style={{
              "--particle-duration": particle.duration,
              "--particle-delay": particle.delay,
            } as CSSProperties}
          />
        ))}

        <div className="action-export__pill action-export__pill--source">
          <span>STANDARDIZED SEGMENT</span>
          <i />
        </div>

        <div className="action-export__action-list">
          {actions.map((action, index) => (
            <div
              className={`action-export__pill action-export__pill--action action-export__pill--action-${index}`}
              key={action.label}
              style={{
                "--action-y": `${action.y}px`,
                "--active-index": action.route,
              } as CSSProperties}
            >
              <i />
              <span>{action.label}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
