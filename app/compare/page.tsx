import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { FMEAComparison } from "@/components/fmea-comparison"

export const dynamic = "force-dynamic"

export default function ComparePage() {
  return (
    <div className="min-h-screen bg-white">
      <Header activePath="/compare" />

      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">FMEA Comparison</h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl">Compare two FMEA reports side-by-side to analyze differences and similarities.</p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <FMEAComparison />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
