"use client"

import type React from "react"

import { useState } from "react"
import { BarChart3, Download } from "lucide-react"
import Link from "next/link"
import { AuthGuard } from "@/components/auth-guard"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WeibullChart } from "@/components/weibull-chart"
import { WeibullParameters } from "@/components/weibull-parameters"

export default function AnalyzeData() {
  const [file, setFile] = useState<File | null>(null)
  const [isAnalyzed, setIsAnalyzed] = useState(false)
  const [activeTab, setActiveTab] = useState("cdf")
  const [shape, setShape] = useState(2.1)
  const [scale, setScale] = useState(4500)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleAnalyze = () => {
    // In a real application, this would process the uploaded file
    // and calculate the Weibull parameters
    setIsAnalyzed(true)
  }

  const handleDownload = () => {
    // In a real application, this would download the analysis results
    alert("Analysis results downloaded")
  }

  return (
    <AuthGuard>
      <div className="flex flex-col min-h-screen">
        <header className="border-b">
          <div className="container flex h-16 items-center justify-between px-4 md:px-6">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl">
              <BarChart3 className="h-6 w-6" />
              <span>ReliabilityTools.ai</span>
            </Link>
            <nav className="hidden md:flex gap-6">
              <Link href="/" className="font-medium text-muted-foreground">
                Home
              </Link>
              <Link href="/generate" className="font-medium text-muted-foreground">
                Generate FMEA
              </Link>
              <Link href="/analyze" className="font-medium">
                Analyze Data
              </Link>
              <Link href="/about" className="font-medium text-muted-foreground">
                About
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1 py-8">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold tracking-tighter">Analyze Reliability Data</h1>
                  <p className="text-muted-foreground mt-2">
                    Upload failure data to fit Weibull distributions and analyze reliability
                  </p>
                </div>
                <Card>
                  <CardHeader>
                    <CardTitle>Upload Data</CardTitle>
                    <CardDescription>
                      Upload CSV file with failure time data or manually enter Weibull parameters
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                      <Label htmlFor="data-file">Failure Time Data (CSV)</Label>
                      <Input id="data-file" type="file" accept=".csv" onChange={handleFileChange} />
                      <p className="text-sm text-muted-foreground">
                        CSV should contain failure times in hours in a single column
                      </p>
                    </div>
                    <div className="flex items-center">
                      <div className="flex-1 border-t" />
                      <span className="mx-2 text-xs text-muted-foreground">OR</span>
                      <div className="flex-1 border-t" />
                    </div>
                    <WeibullParameters shape={shape} scale={scale} onShapeChange={setShape} onScaleChange={setScale} />
                  </CardContent>
                  <CardFooter>
                    <Button onClick={handleAnalyze} disabled={!file && (!shape || !scale)}>
                      {file ? "Analyze Data" : "Generate Distribution"}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
              {isAnalyzed ? (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tighter">Analysis Results</h2>
                    <p className="text-muted-foreground mt-2">Weibull distribution fitted to your reliability data</p>
                  </div>
                  <Card>
                    <CardHeader>
                      <CardTitle>Weibull Distribution</CardTitle>
                      <CardDescription>
                        {file ? "Fitted to uploaded data" : "Generated from parameters"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center space-y-4 p-8 border rounded-lg bg-muted/40">
                    <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground" />
                    <h2 className="text-xl font-medium">Analysis Results Preview</h2>
                    <p className="text-sm text-muted-foreground max-w-md">
                      Upload failure data or enter Weibull parameters to visualize distributions and calculate
                      reliability metrics
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
        <footer className="border-t py-6 md:py-8">
          <div className="container flex flex-col items-center justify-center gap-4 px-4 md:px-6 md:flex-row">
            <div className="flex items-center gap-2 text-sm">
              <BarChart3 className="h-5 w-5" />
              <span className="font-semibold">ReliabilityTools.ai</span>
            </div>
            <p className="text-center text-sm text-muted-foreground md:text-left">
              &copy; {new Date().getFullYear()} ReliabilityTools.ai. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </AuthGuard>
  )
}
