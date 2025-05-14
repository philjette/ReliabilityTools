import { Activity, FileText, Upload } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function About() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header activePath="/about" />
      <main className="flex-1 py-8">
        <div className="container px-4 md:px-6">
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">About AssetX.pro</h1>
              <p className="text-muted-foreground">
                Advanced asset reliability management powered by artificial intelligence
              </p>
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Our Mission</h2>
              <p>
                AssetX.pro was created to empower reliability engineers with advanced analytical tools that leverage
                artificial intelligence to improve asset reliability and reduce downtime. Our platform combines
                traditional reliability engineering methods with cutting-edge AI to provide deeper insights and more
                accurate predictions.
              </p>
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Key Features</h2>
              <div className="grid gap-6 sm:grid-cols-2">
                <Card>
                  <CardHeader>
                    <FileText className="h-8 w-8 text-primary mb-2" />
                    <CardTitle>AI-Enabled FMEA Generation</CardTitle>
                    <CardDescription>Generate comprehensive Failure Mode and Effects Analysis reports</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Our AI analyzes asset characteristics and operational conditions to identify potential failure
                      modes, their effects, and recommended actions. The system learns from industry data to provide
                      increasingly accurate analyses over time.
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <Activity className="h-8 w-8 text-primary mb-2" />
                    <CardTitle>Weibull Distribution Analysis</CardTitle>
                    <CardDescription>Visualize and analyze failure data with interactive charts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Our platform provides powerful tools for Weibull analysis, allowing you to toggle between
                      Cumulative Distribution Function (CDF), Probability Density Function (PDF), and Hazard Function
                      visualizations to gain deeper insights into failure patterns.
                    </p>
                  </CardContent>
                </Card>
                <Card className="sm:col-span-2">
                  <CardHeader>
                    <Upload className="h-8 w-8 text-primary mb-2" />
                    <CardTitle>Data Upload & Analysis</CardTitle>
                    <CardDescription>Upload your own failure data for custom analysis</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Upload your historical failure data to fit Weibull distributions and calculate key reliability
                      metrics such as Mean Time To Failure (MTTF), B10 life, and more. Our platform automatically
                      calculates the optimal Weibull parameters and provides comprehensive reliability insights.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">The Weibull Distribution in Reliability Engineering</h2>
              <p>
                The Weibull distribution is one of the most widely used probability distributions in reliability
                engineering due to its flexibility in modeling various failure patterns. It can represent decreasing,
                constant, or increasing failure rates through its shape parameter (β):
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>β &lt; 1:</strong> Indicates early-life failures or infant mortality (decreasing failure rate)
                </li>
                <li>
                  <strong>β = 1:</strong> Indicates random failures (constant failure rate, equivalent to the
                  exponential distribution)
                </li>
                <li>
                  <strong>β &gt; 1:</strong> Indicates wear-out failures (increasing failure rate)
                </li>
              </ul>
              <p>
                The scale parameter (η) represents the characteristic life, which is the time at which 63.2% of units
                will fail. Together, these parameters provide valuable insights into failure patterns and help engineers
                make informed decisions about maintenance strategies and reliability improvements.
              </p>
            </div>
            <div className="flex justify-center pt-4">
              <Link href="/generate">
                <Button size="lg">Get Started with AssetX.pro</Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
