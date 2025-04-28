import { BarChart3, FileText, Upload } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { HeroButtons } from "@/components/hero-buttons"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header activePath="/" />
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="space-y-4">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  AI-Powered Reliability Engineering Tools
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Generate comprehensive Failure Mode and Effects Analysis (FMEA) reports based on specific asset and
                  operational characteristics. Visualize Weibull distributions and analyze reliability data with ease.
                </p>
                <HeroButtons />
              </div>
              <div className="flex justify-center">
                <div className="relative w-full max-w-[500px] aspect-video rounded-xl overflow-hidden border bg-background shadow-xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-muted/50 to-muted p-6 flex flex-col justify-center">
                    <div className="space-y-2 text-center">
                      <BarChart3 className="h-12 w-12 mx-auto text-primary" />
                      <h3 className="text-xl font-bold">Advanced Reliability Analysis</h3>
                      <p className="text-sm text-muted-foreground">
                        Visualize Weibull distributions with toggleable CDF, PDF, and Hazard Function views
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32">
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
              <div className="flex flex-col items-center space-y-2 border rounded-lg p-6 shadow-sm">
                <FileText className="h-12 w-12 text-primary" />
                <h3 className="text-xl font-bold">AI-Enabled FMEA Generation</h3>
                <p className="text-sm text-center text-muted-foreground">
                  Generate comprehensive FMEA reports based on asset and operational characteristics
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 border rounded-lg p-6 shadow-sm">
                <BarChart3 className="h-12 w-12 text-primary" />
                <h3 className="text-xl font-bold">Weibull Distribution Analysis</h3>
                <p className="text-sm text-center text-muted-foreground">
                  Toggle between CDF, PDF, and Hazard Function visualizations for failure mode analysis
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 border rounded-lg p-6 shadow-sm">
                <Upload className="h-12 w-12 text-primary" />
                <h3 className="text-xl font-bold">Data Upload & Analysis</h3>
                <p className="text-sm text-center text-muted-foreground">
                  Upload asset data to fit Weibull curves and download generated reports
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
