"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowLeft, TrendingUp, BarChart3, Clock, Database } from "lucide-react"
import Link from "next/link"
import { useSupabase } from "@/hooks/use-supabase"
import { useAuth } from "@/contexts/auth-context"
import { WeibullChart } from "@/components/weibull-chart"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import type { WeibullAnalysisResult } from "@/lib/weibull-analysis-actions"

interface ClientCurveDetailProps {
  curveId: string
}

export function ClientCurveDetail({ curveId }: ClientCurveDetailProps) {
  const [curve, setCurve] = useState<WeibullAnalysisResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeUnit, setTimeUnit] = useState<"hours" | "years">("years")
  const [chartType, setChartType] = useState<"cdf" | "pdf" | "hazard">("cdf")
  const { supabase, loading: supabaseLoading } = useSupabase()
  const { user: authUser, loading: authLoading } = useAuth()
  const router = useRouter()

  console.log("ClientCurveDetail mounted with curveId:", curveId)
  console.log("Auth status:", { authUser: !!authUser, authLoading, supabaseLoading })

  useEffect(() => {
    const fetchCurve = async () => {
      if (!supabase) return

      try {
        setLoading(true)
        setError(null)

        console.log("Fetching curve with auth user:", authUser?.id)

        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          console.log("No user found in Supabase session")
          setError("You must be signed in to view curves")
          return
        }

        console.log("Supabase user found:", user.id)

        const { data, error } = await supabase
          .from("weibull_curves")
          .select("*")
          .eq("id", curveId)
          .eq("user_id", user.id)
          .single()

        if (error) {
          setError(error.message)
          console.error("Error fetching curve:", error)
        } else if (!data) {
          setError("Curve not found")
        } else {
          setCurve(data)
          console.log("Fetched curve:", data)
        }
      } catch (err: any) {
        setError(err.message || "Failed to fetch curve")
        console.error("Error fetching curve:", err)
      } finally {
        setLoading(false)
      }
    }

    if (!supabaseLoading && !authLoading && supabase && authUser) {
      fetchCurve()
    } else if (!authLoading && !authUser) {
      setError("You must be signed in to view curves")
      setLoading(false)
    }
  }, [supabase, supabaseLoading, authUser, authLoading, curveId])

  const formatMTTF = (mttf: number) => {
    if (mttf >= 8760) {
      return `${(mttf / 8760).toFixed(1)} years`
    } else if (mttf >= 24) {
      return `${(mttf / 24).toFixed(1)} days`
    } else {
      return `${mttf.toFixed(0)} hours`
    }
  }

  const getShapeInterpretation = (shape: number) => {
    if (shape < 1) return "Early failures (infant mortality)"
    if (shape === 1) return "Random failures (exponential)"
    if (shape > 1 && shape < 2) return "Wear-out failures"
    return "Rapid wear-out failures"
  }

  const getShapeColor = (shape: number) => {
    if (shape < 1) return "bg-blue-100 text-blue-800"
    if (shape === 1) return "bg-green-100 text-green-800"
    if (shape > 1 && shape < 2) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  if (supabaseLoading || authLoading || loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <p className="text-muted-foreground">Loading curve details...</p>
        </div>
        <Footer />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <section className="py-16">
          <div className="container mx-auto px-4">
            <Card>
              <CardHeader>
                <CardTitle>Error Loading Curve</CardTitle>
                <CardDescription>{error}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href="/curves">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Curves
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
        <Footer />
      </div>
    )
  }

  if (!curve) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <section className="py-16">
          <div className="container mx-auto px-4">
            <Card>
              <CardHeader>
                <CardTitle>Curve Not Found</CardTitle>
                <CardDescription>The requested curve could not be found.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href="/curves">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Curves
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="container mx-auto px-4">
          <Button variant="outline" asChild className="mb-4">
            <Link href="/curves">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Curves
            </Link>
          </Button>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{curve.curve_name}</h1>
          <p className="text-xl text-gray-600 max-w-3xl">
            Detailed Weibull analysis for {curve.asset_name}
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Curve Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Analysis Overview</CardTitle>
                <CardDescription>Key parameters and statistics from the Weibull analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {curve.dual_fit ? (
                  <>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-3">Complete (failures only)</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 rounded-lg bg-blue-50/50">
                          <div className="text-xl font-bold">{curve.dual_fit.complete_only.shape_parameter.toFixed(3)}</div>
                          <div className="text-xs text-gray-600">Shape (β)</div>
                          <Badge className={`mt-1 text-xs ${getShapeColor(curve.dual_fit.complete_only.shape_parameter)}`}>
                            {getShapeInterpretation(curve.dual_fit.complete_only.shape_parameter)}
                          </Badge>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-blue-50/50">
                          <div className="text-xl font-bold">
                            {timeUnit === "years"
                              ? (curve.dual_fit.complete_only.scale_parameter / 8760).toFixed(2)
                              : curve.dual_fit.complete_only.scale_parameter.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </div>
                          <div className="text-xs text-gray-600">Scale (η)</div>
                          <div className="text-xs text-gray-500">{timeUnit}</div>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-purple-50/50">
                          <div className="text-xl font-bold">
                            {timeUnit === "years"
                              ? `${(curve.mttf / 8760).toFixed(2)} years`
                              : formatMTTF(curve.mttf)}
                          </div>
                          <div className="text-xs text-gray-600">Mean Time to Failure</div>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-orange-50/50">
                          <div className="text-xl font-bold">{curve.dual_fit.complete_only.total_failures}</div>
                          <div className="text-xs text-gray-600">Failures</div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-3">With right-censored</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 rounded-lg bg-green-50/50">
                          <div className="text-xl font-bold">{curve.dual_fit.with_censored.shape_parameter.toFixed(3)}</div>
                          <div className="text-xs text-gray-600">Shape (β)</div>
                          <Badge className={`mt-1 text-xs ${getShapeColor(curve.dual_fit.with_censored.shape_parameter)}`}>
                            {getShapeInterpretation(curve.dual_fit.with_censored.shape_parameter)}
                          </Badge>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-green-50/50">
                          <div className="text-xl font-bold">
                            {timeUnit === "years"
                              ? (curve.dual_fit.with_censored.scale_parameter / 8760).toFixed(2)
                              : curve.dual_fit.with_censored.scale_parameter.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </div>
                          <div className="text-xs text-gray-600">Scale (η)</div>
                          <div className="text-xs text-gray-500">{timeUnit}</div>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-purple-50/50">
                          <div className="text-xl font-bold">
                            {timeUnit === "years"
                              ? `${(curve.mttf / 8760).toFixed(2)} years`
                              : formatMTTF(curve.mttf)}
                          </div>
                          <div className="text-xs text-gray-600">Mean Time to Failure</div>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-orange-50/50">
                          <div className="text-xl font-bold">{curve.dual_fit.with_censored.data_points}</div>
                          <div className="text-xs text-gray-600">Total (failures + censored)</div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-3">
                        <TrendingUp className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="text-2xl font-bold">{curve.shape_parameter.toFixed(3)}</div>
                      <div className="text-sm text-gray-600">Shape Parameter (β)</div>
                      <Badge className={`mt-2 ${getShapeColor(curve.shape_parameter)}`}>
                        {getShapeInterpretation(curve.shape_parameter)}
                      </Badge>
                    </div>

                    <div className="text-center">
                      <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-3">
                        <Clock className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="text-2xl font-bold">
                        {timeUnit === "years"
                          ? (curve.scale_parameter / 8760).toFixed(2)
                          : curve.scale_parameter.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </div>
                      <div className="text-sm text-gray-600">Scale Parameter (η)</div>
                      <div className="text-xs text-gray-500 mt-1">{timeUnit}</div>
                    </div>

                    <div className="text-center">
                      <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-3">
                        <BarChart3 className="h-6 w-6 text-purple-600" />
                      </div>
                      <div className="text-2xl font-bold">
                        {timeUnit === "years"
                          ? `${(curve.mttf / 8760).toFixed(2)} years`
                          : formatMTTF(curve.mttf)}
                      </div>
                      <div className="text-sm text-gray-600">Mean Time to Failure</div>
                    </div>

                    <div className="text-center">
                      <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg mx-auto mb-3">
                        <Database className="h-6 w-6 text-orange-600" />
                      </div>
                      <div className="text-2xl font-bold">{curve.data_points}</div>
                      <div className="text-sm text-gray-600">Data Points</div>
                      <div className="text-xs text-gray-500 mt-1">failures analyzed</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Chart Controls */}
            <Card>
              <CardHeader>
                <CardTitle>Display Settings</CardTitle>
                <CardDescription>Choose how to display time values and chart type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Time Unit</Label>
                    <RadioGroup value={timeUnit} onValueChange={(value: "hours" | "years") => setTimeUnit(value)}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="hours" id="hours" />
                        <Label htmlFor="hours" className="cursor-pointer">
                          Hours
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="years" id="years" />
                        <Label htmlFor="years" className="cursor-pointer">
                          Years (1 year = 8,760 hours)
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Chart Type</Label>
                    <RadioGroup value={chartType} onValueChange={(value: "cdf" | "pdf" | "hazard") => setChartType(value)}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="cdf" id="cdf" />
                        <Label htmlFor="cdf" className="cursor-pointer">
                          CDF (Cumulative Distribution)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="pdf" id="pdf" />
                        <Label htmlFor="pdf" className="cursor-pointer">
                          PDF (Probability Density)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="hazard" id="hazard" />
                        <Label htmlFor="hazard" className="cursor-pointer">
                          Hazard Rate
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </CardContent>
            </Card>

            {curve.dual_fit && (
              <p className="text-sm text-muted-foreground">
                Including right-censored data (units that haven’t failed yet) uses the fact that they survived at least until their observation time. That usually increases the estimated scale and <strong>lowers</strong> the cumulative probability of failure at a given time, so the green curve (“With right-censored”) typically sits at or below the blue curve (“Complete (failures only)”). Use the green curve for less biased estimates.
              </p>
            )}

            {/* Weibull Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Weibull Distribution Analysis</CardTitle>
                <CardDescription>
                  {chartType === "cdf" && "Cumulative probability of failure over time"}
                  {chartType === "pdf" && "Probability density of failures over time"}
                  {chartType === "hazard" && "Failure rate (hazard rate) over time"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WeibullChart
                  type={chartType}
                  shape={curve.shape_parameter}
                  scale={curve.scale_parameter}
                  timeUnit={timeUnit}
                  failureModes={curve.dual_fit
                    ? [
                        {
                          name: "Complete (failures only)",
                          shape: curve.dual_fit.complete_only.shape_parameter,
                          scale: curve.dual_fit.complete_only.scale_parameter,
                          color: "#0ea5e9",
                        },
                        {
                          name: "With right-censored",
                          shape: curve.dual_fit.with_censored.shape_parameter,
                          scale: curve.dual_fit.with_censored.scale_parameter,
                          color: "#22c55e",
                        },
                      ]
                    : []}
                />
              </CardContent>
            </Card>

            {/* Metadata */}
            <Card>
              <CardHeader>
                <CardTitle>Analysis Details</CardTitle>
                <CardDescription>Information about this Weibull analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Asset Name</p>
                    <p className="text-gray-600">{curve.asset_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Analysis Date</p>
                    <p className="text-gray-600">{new Date(curve.created_at!).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Total Failures</p>
                    <p className="text-gray-600">{curve.total_failures}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Data Points</p>
                    <p className="text-gray-600">{curve.data_points}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
