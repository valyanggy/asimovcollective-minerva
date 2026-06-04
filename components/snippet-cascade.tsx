"use client"

import { AudienceEnrichmentAnimation } from "@/components/audience-enrichment-animation"
import { JourneyMappingAnimation } from "@/components/journey-mapping-animation"
import { ActionExportAnimation } from "@/components/action-export-animation"
import { MatchRateAnimation } from "@/components/match-rate-animation"
import { DataCoverageAnimation } from "@/components/data-coverage-animation"

type Snippet = {
  id: string
  title: string
  backgroundClass: string
}

const snippets: Snippet[] = [
  {
    id: "orbital-ring",
    title: "Audience Enrichment",
    backgroundClass: "snippet-cascade__panel--background-1",
  },
  {
    id: "axis-drift",
    title: "Axis Drift",
    backgroundClass: "snippet-cascade__panel--background-2",
  },
  {
    id: "nested-spin",
    title: "Nested Spin",
    backgroundClass: "snippet-cascade__panel--background-3",
  },
  {
    id: "match-rate",
    title: "Match Rate",
    backgroundClass: "snippet-cascade__panel--plain",
  },
  {
    id: "data-coverage",
    title: "Data Coverage",
    backgroundClass: "snippet-cascade__panel--plain",
  },
]

export function SnippetCascade() {
  function renderAnimation(id: string) {
    if (id === "orbital-ring") return <AudienceEnrichmentAnimation />
    if (id === "axis-drift") return <JourneyMappingAnimation />
    if (id === "nested-spin") return <ActionExportAnimation />
    if (id === "match-rate") return <MatchRateAnimation />
    return <DataCoverageAnimation />
  }

  return (
    <main className="min-h-screen bg-white text-black">
      {snippets.map((snippet) => (
        <section
          key={snippet.id}
          className="grid min-h-screen snap-start place-items-center px-4 py-5 md:px-8 md:py-8"
        >
          <div className="w-full max-w-[1560px] rounded-[3px] border border-black/5 bg-white p-3 shadow-[0_24px_80px_rgba(0,0,0,0.12)] md:p-4">
            <div className={`snippet-cascade__panel ${snippet.backgroundClass}`}>
              {renderAnimation(snippet.id)}
            </div>
          </div>
        </section>
      ))}
    </main>
  )
}
