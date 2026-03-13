import type { Metadata } from "next"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { HeroButtons } from "@/components/hero-buttons"
// import { ScreenshotCarousel } from "@/components/screenshot-carousel"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Zap, BarChart3, FileText } from "lucide-react"

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://reliabilitytools.ai"

export const metadata: Metadata = {
  title: "Reliability Engineering Tools | FMEA & Weibull Analysis",
  description:
    "Professional reliability engineering tools for electrical assets: AI-powered FMEA generation, Weibull failure analysis with right-censored data, and maintenance optimization.",
  openGraph: {
    title: "reliabilitytools.ai – Reliability Engineering Tools | FMEA & Weibull Analysis",
    description:
      "Professional reliability engineering tools for electrical asset management: AI-powered FMEA, Weibull analysis, and maintenance optimization.",
    url: siteUrl,
  },
}

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "reliabilitytools.ai",
  description:
    "Professional reliability engineering tools for electrical asset management: AI-powered FMEA generation, Weibull failure analysis, and maintenance optimization.",
  url: siteUrl,
  applicationCategory: "EngineeringApplication",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  featureList: [
    "AI-powered FMEA generation",
    "Weibull distribution analysis with right-censored data",
    "Failure data import and visualization",
    "PDF report export",
  ],
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">Professional reliability engineering tools</h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Generate comprehensive FMEA reports, analyze failure data, and optimize maintenance strategies for
            electrical transmission and distribution assets with AI-powered insights.
          </p>
          <HeroButtons />
          
          {/* Screenshot carousel - commented out for now, keeping for later use
          <div className="mt-12">
            <ScreenshotCarousel />
          </div>
          */}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Comprehensive Reliability Analysis</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to assess, analyze, and improve the reliability of your electrical assets
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-blue-200 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>Failure Modes and Effects Analysis</CardTitle>
                <CardDescription>
                  Generate comprehensive Failure Mode and Effects Analysis reports using advanced AI
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Asset-specific failure modes</li>
                  <li>• RPN calculations</li>
                  <li>• Maintenance recommendations</li>
                  <li>• Professional PDF reports</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-green-200 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>Lifecycle Modelling</CardTitle>
                <CardDescription>
                  Fit Weibull paranaters to your failure data and analyze key reliability indicators
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Statistical parameter estimation</li>
                  <li>• Reliability curves</li>
                  <li>• Hazard rate analysis</li>
                  <li>• Interactive visualizations</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-purple-200 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>Asset Management</CardTitle>
                <CardDescription>Comprehensive tools for tracking and managing reliability assets</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Risk matrix visualization</li>
                  <li>• FMEA comparison tools</li>
                  <li>• Detailed reporting exports</li>
                  <li>• Asset lifecycle tracking</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      

      <Footer />
    </div>
  )
}
