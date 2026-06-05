"use client"

import type { CSSProperties } from "react"

const logos = [
  { name: "SALESFORCE", src: "/lotties/logo-salesforce.png" },
  { name: "META ADS", src: "/lotties/logo-meta-ads.png" },
  { name: "SNOWFLAKE", src: "/lotties/logo-snowflake.png" },
  { name: "GA4", src: "/lotties/logo-ga4.png" },
  { name: "KLAVIYO", src: "/lotties/logo-klaviyo.png" },
  { name: "HUBSPOT", src: "/lotties/logo-hubspot.png" },
  { name: "GOOGLE ADS", src: "/lotties/logo-google-ads.png" },
  { name: "BIGQUERY", src: "/lotties/logo-bigquery.png" },
] as const

const minervaTags = ["CAREER", "AFFINITIES", "DEMOGRAPHICS", "FINANCIAL", "EDUCATION", "CONTACT", "RESIDENCE"]

const actions = [
  { label: "PUSH TO INTEGRATION", y: 118 },
  { label: "CREATE CAMPAIGN", y: 198 },
  { label: "SIMULATE CAMPAIGN", y: 278 },
  { label: "RUN ANALYSIS", y: 358 },
  { label: "MONITOR PERFORMANCE", y: 438 },
  { label: "GENERATE REPORT", y: 518 },
  { label: "DEVELOP HYPOTHESIS", y: 598 },
] as const

const pathDarkPaths = [
  "M350 299.291C287.04 299.291 236 232.134 236 149.291",
  "M350 0.291445C287.04 0.291444 236 67.001 236 149.291",
  "M350 247.291C287.04 247.291 236 202.968 236 148.291",
  "M350 50.2914C287.04 50.2914 236 94.1675 236 148.291",
  "M350 199.291C287.04 199.291 236 176.906 236 149.291",
  "M-4.19021e-05 260.348C52.467 260.348 95 210.204 95 148.348",
  "M350 98.2914C287.04 98.2914 236 121.125 236 149.291",
  "M-1.01924e-05 35.3478C52.467 35.3478 95 85.9396 95 148.348",
  "M236 148.291H350",
] as const

const outputParticlePaths = [
  "M236 149.291C236 232.134 287.04 299.291 350 299.291",
  "M236 149.291C236 67.001 287.04 0.291444 350 0.291445",
  "M236 148.291C236 202.968 287.04 247.291 350 247.291",
  "M236 148.291C236 94.1675 287.04 50.2914 350 50.2914",
  "M236 149.291C236 176.906 287.04 199.291 350 199.291",
  "M236 149.291C236 121.125 287.04 98.2914 350 98.2914",
  "M236 148.291H350",
] as const

const particles = [
  { path: pathDarkPaths[7], duration: "4.4s", delay: "-0.2s" },
  { path: pathDarkPaths[7], duration: "5.6s", delay: "-2.1s" },
  { path: pathDarkPaths[5], duration: "4.9s", delay: "-1.4s" },
  { path: pathDarkPaths[5], duration: "6.2s", delay: "-3.5s" },
  { path: outputParticlePaths[1], duration: "4.9s", delay: "-0.8s" },
  { path: outputParticlePaths[3], duration: "5.5s", delay: "-1.6s" },
  { path: outputParticlePaths[5], duration: "4.7s", delay: "-2.4s" },
  { path: outputParticlePaths[6], duration: "5.2s", delay: "-3.1s" },
  { path: outputParticlePaths[4], duration: "4.8s", delay: "-1.1s" },
  { path: outputParticlePaths[2], duration: "5.8s", delay: "-2.9s" },
  { path: outputParticlePaths[0], duration: "5.1s", delay: "-3.7s" },
] as const

const dotColors = ["#E5B74D", "#2D3CAE", "#2D3CAE", "#11196F", "#E5B74D", "#2D3CAE", "#11196F"]

function buildMatrix() {
  return Array.from({ length: 100 }, (_, index) => dotColors[(index * 5 + Math.floor(index / 10)) % dotColors.length])
}

export function IntegrationFlowAnimation() {
  const logoRail = [...logos, ...logos]

  return (
    <div className="integration-flow" aria-label="Customer data integration animation">
      <div className="integration-flow__stage">
        <svg className="integration-flow__paths" viewBox="0 0 350 300" preserveAspectRatio="none" role="presentation">
          {pathDarkPaths.map((path) => (
            <path d={path} key={path} />
          ))}
          {particles.map((particle, index) => (
            <circle className="integration-flow__particle" r="1.8" key={`${particle.path}-${index}`}>
              <animateMotion dur={particle.duration} begin={particle.delay} repeatCount="indefinite" path={particle.path} />
              <animate
                attributeName="opacity"
                dur={particle.duration}
                begin={particle.delay}
                repeatCount="indefinite"
                values="0;1;1;0"
                keyTimes="0;0.12;0.82;1"
              />
            </circle>
          ))}
        </svg>

        <div className="integration-flow__customer-card">
          <h3>CUSTOMER DATA</h3>
          <div className="integration-flow__logo-window">
            <div className="integration-flow__logo-viewport">
              <div className="integration-flow__logo-track">
                {logoRail.map((logo, index) => (
                  <div className="integration-flow__logo-item" key={`${logo.name}-${index}`}>
                    <img src={logo.src} alt="" />
                    <span>{logo.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="integration-flow__minerva-card">
          <h3>MINERVA DATA</h3>
          <div className="integration-flow__tag-grid">
            {minervaTags.map((tag) => (
              <div className="integration-flow__tag" key={tag}>
                <i />
                <span>{tag}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="integration-flow__engineer-card">
          <div className="integration-flow__matrix">
            {buildMatrix().map((color, index) => (
              <i
                key={index}
                style={
                  {
                    "--flow-dot-color": color,
                    "--flow-dot-delay": `${(index % 17) * -0.08}s`,
                  } as CSSProperties
                }
              />
            ))}
          </div>
          <h3>AGENTIC DATA<br />ENGINEER</h3>
        </div>

        <div className="integration-flow__actions">
          {actions.map((action) => (
            <div className="integration-flow__action-pill" key={action.label} style={{ "--action-y": `${action.y}px` } as CSSProperties}>
              <i />
              <span>{action.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
