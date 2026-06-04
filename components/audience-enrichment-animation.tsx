"use client"

import type { CSSProperties } from "react"

const rows = ["EDUCATION", "CAREER", "AFFINITIES", "CONTACT", "FINANCIAL", "RESIDENCE", "DEMOGRAPHICS"]

const particles = [
  { route: 0, duration: "4.8s", delay: "-0.4s" },
  { route: 1, duration: "6.4s", delay: "-2.1s" },
  { route: 2, duration: "5.6s", delay: "-1.2s" },
  { route: 3, duration: "7.2s", delay: "-3.8s" },
  { route: 4, duration: "5.1s", delay: "-2.7s" },
  { route: 5, duration: "6.9s", delay: "-4.4s" },
  { route: 6, duration: "4.3s", delay: "-1.8s" },
  { route: 1, duration: "8.1s", delay: "-5.6s" },
  { route: 5, duration: "6.2s", delay: "-0.9s" },
  { route: 0, duration: "5.8s", delay: "-3.2s" },
] as const

export function AudienceEnrichmentAnimation() {
  return (
    <div className="audience-flow" aria-label="Audience enrichment animation">
      <div className="audience-flow__stage">
        <img className="audience-flow__paths" src="/lotties/lines.svg" alt="" aria-hidden="true" />

        {particles.map((particle, index) => (
          <span
            className={`audience-flow__particle audience-flow__particle--route-${particle.route}`}
            key={`${particle.route}-${index}`}
            style={{
              "--particle-duration": particle.duration,
              "--particle-delay": particle.delay,
            } as CSSProperties}
          />
        ))}

        <div className="audience-flow__pill audience-flow__pill--source">
          <span>YOUR DATA</span>
          <i />
        </div>

        <div className="audience-flow__hub" aria-hidden="true">
          <img src="/lotties/logo.svg" alt="" />
        </div>

        <div className="audience-flow__stack">
          {rows.map((row) => {
            const isDemo = row === "DEMOGRAPHICS"

            return (
              <div className={isDemo ? "audience-flow__row audience-flow__row--demo" : "audience-flow__row"} key={row}>
                <div className="audience-flow__row-head">
                  <i />
                  <span>{row}</span>
                  <b>{isDemo ? "-" : "+"}</b>
                </div>

                {isDemo ? (
                  <div className="audience-flow__demo-body">
                    <img
                      className="audience-flow__demo-visual"
                      src="/lotties/demographic-visual.svg"
                      alt=""
                      aria-hidden="true"
                    />
                    <div className="audience-flow__view">VIEW ALL <span>→</span></div>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>

        <div className="audience-flow__pill audience-flow__pill--result">
          <i />
          <span>ENRICHED AUDIENCE 1</span>
        </div>
      </div>
    </div>
  )
}
