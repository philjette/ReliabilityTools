import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://reliabilitytools.ai"

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "reliabilitytools.ai – Reliability Engineering Tools | FMEA & Weibull Analysis",
    template: "%s | reliabilitytools.ai",
  },
  description:
    "Professional reliability engineering tools for electrical asset management: AI-powered FMEA generation, Weibull failure analysis with right-censored data, and maintenance optimization.",
  keywords: [
    "reliability engineering",
    "FMEA",
    "failure mode effects analysis",
    "Weibull analysis",
    "electrical asset management",
    "maintenance optimization",
    "failure data analysis",
    "reliability tools",
  ],
  authors: [{ name: "reliabilitytools.ai", url: siteUrl }],
  creator: "reliabilitytools.ai",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "reliabilitytools.ai",
    title: "reliabilitytools.ai – Reliability Engineering Tools | FMEA & Weibull Analysis",
    description:
      "Professional reliability engineering tools for electrical asset management: AI-powered FMEA, Weibull analysis, and maintenance optimization.",
  },
  twitter: {
    card: "summary_large_image",
    title: "reliabilitytools.ai – Reliability Engineering Tools",
    description: "AI-powered FMEA generation and Weibull failure analysis for electrical assets.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: { canonical: siteUrl },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
