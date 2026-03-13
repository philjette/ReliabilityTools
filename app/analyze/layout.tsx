import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Data Analysis",
  description:
    "Upload failure data and run Weibull analysis: fit parameters, view reliability curves, and export results. Supports right-censored data for unbiased estimates.",
  openGraph: {
    title: "Data Analysis – Weibull Failure Analysis | reliabilitytools.ai",
    description:
      "Weibull distribution analysis for failure data with right-censored support. Upload CSV, fit parameters, visualize reliability and hazard curves.",
  },
}

export default function AnalyzeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
