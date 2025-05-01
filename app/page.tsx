import Image from "next/image"
import { Activity, FileText, Upload, ArrowRight, CheckCircle } from "lucide-react"
import { HeroButtons } from "@/components/hero-buttons"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="space-y-4">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  AI-Powered Reliability Engineering
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Generate comprehensive Failure Mode and Effects Analysis (FMEA) reports based on specific asset and
                  operational characteristics. Visualize Weibull distributions and analyze reliability data with ease.
                </p>
                <HeroButtons />
              </div>
              <div className="flex justify-center">
                <div className="relative w-full max-w-[500px] aspect-video rounded-xl overflow-hidden border bg-background shadow-xl">
                  <Image
                    src="/images/dashboard-screenshot.png"
                    alt="AssetX.pro Dashboard"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Screenshots Section */}
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Powerful Asset Management Tools
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  See how our platform helps reliability engineers make better decisions
                </p>
              </div>
            </div>

            {/* FMEA Builder Screenshot */}
            <div className="grid gap-12 lg:grid-cols-2 items-center mb-20">
              <div className="order-2 lg:order-1">
                <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden border shadow-lg">
                  <Image
                    src="/images/fmea-builder-screenshot.png"
                    alt="FMEA Builder Interface"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
              <div className="space-y-4 order-1 lg:order-2">
                <h3 className="text-2xl font-bold">AI-Powered FMEA Generation</h3>
                <p className="text-muted-foreground">
                  Our intelligent FMEA builder helps you identify potential failure modes for electrical transmission
                  and distribution assets based on their specific characteristics and operating conditions.
                </p>
                <ul className="space-y-2">
                  {[
                    "Generate comprehensive FMEA reports in minutes",
                    "Identify critical failure modes based on asset characteristics",
                    "Get preventative maintenance recommendations",
                    "Calculate Risk Priority Numbers (RPN) automatically",
                    "Export to PDF for easy sharing",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="pt-4">
                  <Link href="/auth/signin">
                    <Button>
                      Try the FMEA Builder
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Data Analysis Screenshot */}
            <div className="grid gap-12 lg:grid-cols-2 items-center">
              <div className="space-y-4">
                <h3 className="text-2xl font-bold">Advanced Reliability Analysis</h3>
                <p className="text-muted-foreground">
                  Visualize failure patterns with interactive Weibull distribution charts and calculate key reliability
                  metrics to optimize maintenance strategies.
                </p>
                <ul className="space-y-2">
                  {[
                    "Toggle between CDF, PDF, and Hazard Function views",
                    "Upload your own failure data for analysis",
                    "Calculate MTTF, B10 life, and reliability metrics",
                    "Compare multiple failure modes in a single view",
                    "Make data-driven maintenance decisions",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="pt-4">
                  <Link href="/auth/signin">
                    <Button>
                      Explore Data Analysis
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
              <div>
                <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden border shadow-lg">
                  <Image
                    src="/images/data-analysis-screenshot.png"
                    alt="Data Analysis Dashboard"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Key Features Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Key Features</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Powerful tools designed specifically for reliability engineers
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3 lg:gap-12 mt-8">
              <div className="flex flex-col items-center space-y-2 border rounded-lg p-6 shadow-sm bg-background">
                <FileText className="h-12 w-12 text-primary" />
                <h3 className="text-xl font-bold">AI-Enabled FMEA Generation</h3>
                <p className="text-sm text-center text-muted-foreground">
                  Generate comprehensive FMEA reports based on asset and operational characteristics
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 border rounded-lg p-6 shadow-sm bg-background">
                <Activity className="h-12 w-12 text-primary" />
                <h3 className="text-xl font-bold">Weibull Distribution Analysis</h3>
                <p className="text-sm text-center text-muted-foreground">
                  Toggle between CDF, PDF, and Hazard Function visualizations for failure mode analysis
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 border rounded-lg p-6 shadow-sm bg-background">
                <Upload className="h-12 w-12 text-primary" />
                <h3 className="text-xl font-bold">Data Upload & Analysis</h3>
                <p className="text-sm text-center text-muted-foreground">
                  Upload asset data to fit Weibull curves and download generated reports
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 border-t">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Ready to Improve Your Asset Reliability?
                </h2>
                <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Sign in now to access our full suite of reliability engineering tools
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row pt-4">
                <Link href="/auth/signin">
                  <Button size="lg" className="gap-1.5">
                    Get Started Now
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/about">
                  <Button size="lg" variant="outline">
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
