"use client"

import { useState } from "react"
import { Download } from "lucide-react"
import { AuthGuard } from "@/components/auth-guard"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WeibullParameters } from "@/components/weibull-parameters"
import { WeibullChart } from "@/components/weibull-chart"
import { AssetDataUpload } from "@/components/asset-data-upload"
import { CSVTemplateButton } from "@/components/csv-template-button"

export default function AnalyzeData() {
  const [activeTab, setActiveTab] = useState<string>("manual")
  const [shape, setShape] = useState(2.1)
  const [scale, setScale] = useState(4500)
  const [isAnalyzed, setIsAnalyzed] = useState(false)
  const [chartType, setChartType] = useState("cdf")

  const handleAnalyze = () => {
    setIsAnalyzed(true)
  }

  const handleDownload = () => {
    // In a real application, this would download the analysis results
    alert("Analysis results downloaded")
  }

  return (
    <AuthGuard>
      <div className="flex flex-col min-h-screen">
        <main className="flex-1 py-8">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold tracking-tighter">Analyze Reliability Data</h1>
                <p className="text-muted-foreground mt-2">
                  Upload failure data to fit Weibull distributions and analyze reliability
                </p>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="manual">Manual Parameters</TabsTrigger>
                <TabsTrigger value="upload">Upload Asset Data</TabsTrigger>
              </TabsList>

              <TabsContent value="manual" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Manual Weibull Parameters</CardTitle>
                    <CardDescription>Manually enter Weibull parameters to visualize distributions</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <WeibullParameters shape={shape} scale={scale} onShapeChange={setShape} onScaleChange={setScale} />
                  </CardContent>
                  <CardFooter>
                    <Button onClick={handleAnalyze} disabled={!shape || !scale}>
                      Generate Distribution
                    </Button>
                  </CardFooter>
                </Card>

                {isAnalyzed && (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle>Weibull Distribution</CardTitle>
                        <CardDescription>Generated from parameters</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Tabs value={chartType} onValueChange={setChartType} className="w-full">
                          <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="cdf">CDF</TabsTrigger>
                            <TabsTrigger value="pdf">PDF</TabsTrigger>
                            <TabsTrigger value="hazard">Hazard</TabsTrigger>
                          </TabsList>
                          <TabsContent value="cdf" className="pt-4">
                            <WeibullChart type="cdf" shape={shape} scale={scale} />
                          </TabsContent>
                          <TabsContent value="pdf" className="pt-4">
                            <WeibullChart type="pdf" shape={shape} scale={scale} />
                          </TabsContent>
                          <TabsContent value="hazard" className="pt-4">
                            <WeibullChart type="hazard" shape={shape} scale={scale} />
                          </TabsContent>
                        </Tabs>
                      </CardContent>
                      <CardFooter className="flex justify-between">
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium">Shape (β):</span> {shape.toFixed(2)} |{" "}
                          <span className="font-medium">Scale (η):</span> {scale.toFixed(0)} hours
                        </div>
                        <Button variant="outline" size="sm" onClick={handleDownload}>
                          <Download className="h-4 w-4 mr-2" />
                          Download Results
                        </Button>
                      </CardFooter>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Reliability Metrics</CardTitle>
                        <CardDescription>Key reliability indicators based on Weibull parameters</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Mean Time To Failure (MTTF)</p>
                            <p className="text-2xl font-bold">
                              {(scale * Math.exp(1) ** (1 / shape)).toFixed(0)} <span className="text-sm">hours</span>
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Median Life</p>
                            <p className="text-2xl font-bold">
                              {(scale * Math.log(2) ** (1 / shape)).toFixed(0)} <span className="text-sm">hours</span>
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium">B10 Life</p>
                            <p className="text-2xl font-bold">
                              {(scale * Math.log(1 / 0.9) ** (1 / shape)).toFixed(0)}{" "}
                              <span className="text-sm">hours</span>
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Reliability at 1000 hours</p>
                            <p className="text-2xl font-bold">
                              {(Math.exp(-((1000 / scale) ** shape)) * 100).toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </TabsContent>

              <TabsContent value="upload" className="space-y-4">
                <div className="flex justify-end">
                  <CSVTemplateButton />
                </div>
                <AssetDataUpload />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
