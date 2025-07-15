import Link from "next/link"
import { ArrowRight, CheckCircle, FileText, BarChart3, Shield, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { HeroButtons } from "@/components/hero-buttons"

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header activePath="/" />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Professional Reliability Engineering Tools
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                  Generate comprehensive FMEA reports and analyze failure data for electrical assets. Streamline your
                  reliability engineering workflow with AI-powered insights.
                </p>
              </div>
              <HeroButtons />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-12 md:py-24 lg:py-32 bg-gray-50 dark:bg-gray-900">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-3 lg:gap-12">
              <Card>
                <CardHeader>
                  <FileText className="h-10 w-10 mb-2 text-primary" />
                  <CardTitle>FMEA Generation</CardTitle>
                  <CardDescription>
                    Create comprehensive Failure Mode and Effects Analysis reports for electrical assets
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      <span className="text-sm">AI-powered failure mode identification</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      <span className="text-sm">Risk Priority Number (RPN) calculation</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      <span className="text-sm">Maintenance recommendations</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      <span className="text-sm">PDF export capability</span>
                    </li>
                  </ul>
                  <Button className="w-full mt-4" asChild>
                    <Link href="/generate">
                      Start FMEA Generation
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <BarChart3 className="h-10 w-10 mb-2 text-primary" />
                  <CardTitle>Reliability Analysis</CardTitle>
                  <CardDescription>Analyze failure data and generate Weibull distribution curves</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      <span className="text-sm">Weibull parameter estimation</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      <span className="text-sm">Failure probability curves</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      <span className="text-sm">CSV data import</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      <span className="text-sm">Interactive visualizations</span>
                    </li>
                  </ul>
                  <Button className="w-full mt-4 bg-transparent" variant="outline" asChild>
                    <Link href="/analyze">
                      Analyze Data
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Shield className="h-10 w-10 mb-2 text-primary" />
                  <CardTitle>Asset Coverage</CardTitle>
                  <CardDescription>Comprehensive support for various electrical assets</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <Zap className="h-4 w-4 mr-2 text-blue-500" />
                      <span className="text-sm">Power Transformers</span>
                    </li>
                    <li className="flex items-center">
                      <Zap className="h-4 w-4 mr-2 text-blue-500" />
                      <span className="text-sm">Circuit Breakers</span>
                    </li>
                    <li className="flex items-center">
                      <Zap className="h-4 w-4 mr-2 text-blue-500" />
                      <span className="text-sm">Switchgear</span>
                    </li>
                    <li className="flex items-center">
                      <Zap className="h-4 w-4 mr-2 text-blue-500" />
                      <span className="text-sm">Protection Systems</span>
                    </li>
                  </ul>
                  <Button className="w-full mt-4 bg-transparent" variant="outline" asChild>
                    <Link href="/about">
                      Learn More
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Screenshots Section */}
        

        {/* CTA Section */}
        
      </main>
      <Footer />
    </div>
  )
}
