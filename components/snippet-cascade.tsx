"use client"

import { AudienceEnrichmentAnimation } from "@/components/audience-enrichment-animation"
import { JourneyMappingAnimation } from "@/components/journey-mapping-animation"
import { ActionExportAnimation } from "@/components/action-export-animation"

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
]

export function SnippetCascade() {
  return (
    <main className="min-h-screen bg-white text-black">
      {snippets.map((snippet) => (
        <section
          key={snippet.id}
          className="grid min-h-screen snap-start place-items-center px-4 py-5 md:px-8 md:py-8"
        >
          <div className="w-full max-w-[1560px] rounded-[3px] border border-black/5 bg-white p-3 shadow-[0_24px_80px_rgba(0,0,0,0.12)] md:p-4">
            {snippet.id === "orbital-ring" ? (
              <div className={`snippet-cascade__panel ${snippet.backgroundClass}`}>
                <AudienceEnrichmentAnimation />
              </div>
            ) : snippet.id === "axis-drift" ? (
              <div className={`snippet-cascade__panel ${snippet.backgroundClass}`}>
                <JourneyMappingAnimation />
              </div>
            ) : (
              <div className={`snippet-cascade__panel ${snippet.backgroundClass}`}>
                <ActionExportAnimation />
              </div>
            )}
          </div>
        </section>
      ))}
    </main>
  )
}
