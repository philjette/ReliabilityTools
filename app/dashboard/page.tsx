import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ClientDashboard } from "@/components/client-dashboard"

export const dynamic = "force-dynamic"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header activePath="/dashboard" />

      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">FMEA Dashboard</h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl">View, manage, and analyze your saved FMEA reports.</p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <ClientDashboard />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
