import { Zap, Brain, FileText, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import Link from "next/link"

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header activePath="/about" />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-12 bg-gray-50">
          <div className="container px-4 md:px-6">
            <div className="max-w-3xl mx-auto text-center space-y-4">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Zap className="h-10 w-10 text-blue-600" />
                <h1 className="text-4xl font-bold">About AssetX.pro</h1>
              </div>
              <p className="text-xl text-gray-600">
                Advanced reliability engineering tools powered by artificial intelligence for electrical transmission
                and distribution assets.
              </p>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-16">
          <div className="container px-4 md:px-6">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  To revolutionize reliability engineering by making advanced FMEA generation and asset analysis
                  accessible to every engineer, powered by cutting-edge AI technology.
                </p>
              </div>

              <div className="bg-blue-50 rounded-lg p-8">
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h3 className="text-xl font-semibold mb-3">What We Do</h3>
                    <p className="text-gray-600">
                      We provide intelligent tools that automate the complex process of Failure Mode and Effects
                      Analysis (FMEA) for electrical assets, helping engineers identify potential failures before they
                      occur and optimize maintenance strategies.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-3">Why It Matters</h3>
                    <p className="text-gray-600">
                      Reliable electrical infrastructure is critical for modern society. Our tools help prevent costly
                      outages, improve safety, and extend asset lifecycles through data-driven reliability engineering.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Key Features Section */}
        <section className="py-16 bg-gray-50">
          <div className="container px-4 md:px-6">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">Key Features</h2>
                <p className="text-lg text-gray-600">
                  Comprehensive reliability engineering tools designed for electrical asset management
                </p>
              </div>

              <div className="grid gap-8 md:grid-cols-3">
                <Card className="bg-white">
                  <CardHeader>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                      <Brain className="h-6 w-6 text-blue-600" />
                    </div>
                    <CardTitle>AI-Enabled FMEA Generation</CardTitle>
                    <CardDescription>
                      Generate comprehensive Failure Mode and Effects Analysis reports using advanced AI that
                      understands electrical asset characteristics and failure patterns.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• Asset-specific failure mode identification</li>
                      <li>• Automated RPN calculations</li>
                      <li>• Maintenance recommendations</li>
                      <li>• Industry-standard compliance</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="bg-white">
                  <CardHeader>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                      <BarChart3 className="h-6 w-6 text-green-600" />
                    </div>
                    <CardTitle>Weibull Distribution Analysis</CardTitle>
                    <CardDescription>
                      Perform advanced statistical analysis of failure data with interactive Weibull distribution
                      modeling and reliability predictions.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• Interactive parameter adjustment</li>
                      <li>• CDF, PDF, and hazard rate charts</li>
                      <li>• Reliability forecasting</li>
                      <li>• Data-driven insights</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="bg-white">
                  <CardHeader>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                      <FileText className="h-6 w-6 text-purple-600" />
                    </div>
                    <CardTitle>Professional PDF Export</CardTitle>
                    <CardDescription>
                      Export comprehensive, professional-grade reports that meet industry standards and can be shared
                      with stakeholders and regulatory bodies.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• Industry-standard formatting</li>
                      <li>• Complete analysis documentation</li>
                      <li>• Charts and visualizations</li>
                      <li>• Ready for compliance reporting</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <div className="text-center mt-12">
                <Link href="/generate">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
