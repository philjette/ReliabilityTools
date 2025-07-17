"use client"

import { useState } from "react"

import type React from "react"
import { AssetDataUpload } from "@/components/asset-data-upload"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { useToast } from "@/components/ui/use-toast"
import { estimateWeibullParameters } from "@/lib/weibull-mle"

interface AnalysisData {
  failureTimes: number[]
  weibullParams: {
    shape: number
    scale: number
    reliability: Array<{ time: number; reliability: number }>
    hazardRate: Array<{ time: number; hazardRate: number }>
  }
  statistics: {
    meanTime: number
    medianTime: number
    totalFailures: number
    dataPoints: number
  }
}

export default function AnalyzePage() {
  const { toast } = useToast()
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith(".csv")) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a CSV file",
        variant: "destructive",
      })
      return
    }

    setIsAnalyzing(true)
    try {
      const text = await file.text()
      const lines = text.split("\n").filter((line) => line.trim())

      // Skip header row and parse failure times
      const failureTimes = lines
        .slice(1)
        .map((line) => {
          const columns = line.split(",")
          return Number.parseFloat(columns[1]) // Assuming failure time is in second column
        })
        .filter((time) => !isNaN(time) && time > 0)

      if (failureTimes.length < 3) {
        throw new Error("Need at least 3 valid failure time data points")
      }

      // Calculate Weibull parameters
      const weibullParams = estimateWeibullParameters(failureTimes)

      // Generate reliability and hazard rate curves
      const maxTime = Math.max(...failureTimes) * 1.5
      const timePoints = Array.from({ length: 100 }, (_, i) => (i + 1) * (maxTime / 100))

      const reliability = timePoints.map((t) => ({
        time: t,
        reliability: Math.exp(-Math.pow(t / weibullParams.scale, weibullParams.shape)),
      }))

      const hazardRate = timePoints.map((t) => ({
        time: t,
        hazardRate:
          (weibullParams.shape / weibullParams.scale) * Math.pow(t / weibullParams.scale, weibullParams.shape - 1),
      }))

      // Calculate statistics
      const meanTime = failureTimes.reduce((sum, time) => sum + time, 0) / failureTimes.length
      const sortedTimes = [...failureTimes].sort((a, b) => a - b)
      const medianTime = sortedTimes[Math.floor(sortedTimes.length / 2)]

      setAnalysisData({
        failureTimes,
        weibullParams: {
          ...weibullParams,
          reliability,
          hazardRate,
        },
        statistics: {
          meanTime,
          medianTime,
          totalFailures: failureTimes.length,
          dataPoints: failureTimes.length,
        },
      })

      toast({
        title: "Analysis Complete",
        description: `Successfully analyzed ${failureTimes.length} failure data points`,
      })
    } catch (error) {
      console.error("Error analyzing data:", error)
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze the data",
        variant: "destructive",
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Header activePath="/analyze" />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Reliability Data Analysis</h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Upload historical asset failure data to perform advanced Weibull distribution analysis using Maximum
            Likelihood Estimation and generate comprehensive reliability insights.
          </p>

          {/* Feature highlights */}
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Instructions Section */}
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-8">
                Upload your historical asset data and let our advanced algorithms analyze failure patterns, estimate
                reliability parameters, and provide actionable insights for maintenance planning.
              </p>

              <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-blue-600">1</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Data</h3>
                  <p className="text-gray-600">Upload CSV file with asset installation and failure dates</p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-green-600">2</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Analyze</h3>
                  <p className="text-gray-600">Our MLE algorithm fits Weibull parameters to your data</p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-purple-600">3</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Insights</h3>
                  <p className="text-gray-600">Get reliability metrics and interactive visualizations</p>
                </div>
              </div>
            </div>

            {/* Upload Component */}
            <AssetDataUpload />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
