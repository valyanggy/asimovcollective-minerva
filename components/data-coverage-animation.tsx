"use client"

import type { CSSProperties } from "react"
import { useEffect, useState } from "react"

const categoryData = [
  {
    label: "WHO THEY ARE",
    details: [
      { title: "COVERAGE", body: "~30 core identity fields" },
      {
        title: "WHAT IT TELLS YOU",
        body: "Name, age, gender, marital status, household composition, ethnicity, education, contact",
      },
      {
        title: "REACH",
        body: "260M+ reachable individuals · 210M+ verified personal emails · 235M+ phone numbers · 110M+ LinkedIn profiles",
      },
    ],
  },
  {
    label: "WHERE THEY ARE",
    details: [
      { title: "COVERAGE", body: "350M addresses, property-level" },
      {
        title: "WHAT IT TELLS YOU",
        body: "Current + historical address, home value + equity, sqft + bedrooms, ownership, ZIP+4, DMA",
      },
      {
        title: "REACH",
        body: "160M+ residential property records · 90M+ verified homeowners · ~2M new movers / month",
      },
    ],
  },
  {
    label: "WHAT DO THEY DO",
    details: [
      { title: "COVERAGE", body: "~60% coverage, professional" },
      {
        title: "WHAT IT TELLS YOU",
        body: "Full work history, seniority, company size + industry, executive flags, education",
      },
      {
        title: "REACH",
        body: "140M+ professionals · 90M+ B2B2C enriched records · 40M+ company profiles",
      },
    ],
  },
  {
    label: "HOW WEALTHY",
    details: [
      { title: "COVERAGE", body: "100% coverage, modeled" },
      {
        title: "WHAT IT TELLS YOU",
        body: "Income range up to $1M+, wealth range up to $50M+, deposits, assets, investments, credit signals",
      },
      {
        title: "REACH",
        body: "10M+ HNW individuals · 3M+ HNW households · 500K+ UHNW individuals",
      },
    ],
  },
  {
    label: "WHAT THEY'RE INTERESTED IN",
    details: [
      { title: "COVERAGE", body: "2,850+ modeled affinities" },
      {
        title: "WHAT IT TELLS YOU",
        body: "Interest scores, purchase predictors, brand preferences, luxury vs bargain indicators, life-event triggers",
      },
      {
        title: "REACH",
        body: "60+ behavioral segments · luxury / bargain / health-conscious / experiential / etc.",
      },
    ],
  },
  {
    label: "WHAT THEY JUST DID",
    details: [
      { title: "COVERAGE", body: "41K topics, 7/30/90-day windows" },
      {
        title: "WHAT IT TELLS YOU",
        body: "URL-level browsing, topic affinity with time-decay, IAB + brand intent, device + MAID + IP resolution",
      },
      {
        title: "REACH",
        body: "41K topics tracked · time-weighted decay · cross-device resolution",
      },
    ],
  },
]

function getDetailSlot(index: number, activeIndex: number) {
  const delta = index - activeIndex

  if (delta === 0) return "active"
  if (delta === 1) return "next"
  if (delta > 1) return "lower"
  if (delta === -1) return "previous"
  return "hidden"
}

export function DataCoverageAnimation() {
  const [activeState, setActiveState] = useState({ categoryIndex: 0, detailIndex: 0 })

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveState((current) => {
        if (current.detailIndex < 2) {
          return { ...current, detailIndex: current.detailIndex + 1 }
        }

        return {
          categoryIndex: (current.categoryIndex + 1) % categoryData.length,
          detailIndex: 0,
        }
      })
    }, 2300)

    return () => window.clearInterval(timer)
  }, [])

  const activeCategory = categoryData[activeState.categoryIndex]
  const stageStyle = {
    "--active-y": "121px",
    "--category-shift": `${activeState.categoryIndex * -83}px`,
  } as CSSProperties

  return (
    <div className="data-coverage" aria-label="Data coverage animation">
      <div className="data-coverage__stage" style={stageStyle}>
        <div className="data-coverage__left-window">
          <div className="data-coverage__left-track">
            <img className="data-coverage__curve-group" src="/lotties/curve-group.svg" alt="" aria-hidden="true" />

            <div className="data-coverage__categories">
              {categoryData.map((category, index) => (
                <div
                  className={`data-coverage__category${
                    index === activeState.categoryIndex ? " data-coverage__category--active" : ""
                  }`}
                  key={category.label}
                >
                  <i />
                  <span>{category.label}</span>
                  <b>+</b>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="data-coverage__active-link-line" aria-hidden="true" />

        <div className="data-coverage__detail-stack">
          {activeCategory.details.map((detail, index) => {
            const slot = getDetailSlot(index, activeState.detailIndex)

            return (
              <div className={`data-coverage__detail data-coverage__detail--slot-${slot}`} key={detail.title}>
                <div className="data-coverage__detail-title">
                  <i />
                  <span>{detail.title}</span>
                </div>
                <p>{detail.body}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
