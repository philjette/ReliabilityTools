"use client"

import { useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ClientCurvesDashboard } from "@/components/client-curves-dashboard"

export const dynamic = "force-dynamic"

export default function CurvesPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header activePath="/curves" />

      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">My Failure Curves</h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl">View, manage, and analyze your saved Weibull failure curves.</p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <ClientCurvesDashboard />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
