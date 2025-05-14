import { redirect } from "next/navigation"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { FMEAComparison } from "@/components/fmea-comparison"

export default async function CompareFMEAs() {
  const supabase = createServerComponentClient({ cookies })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Redirect to home if not authenticated
  if (!session) {
    redirect("/")
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header activePath="/dashboard" />
      <main className="flex-1 py-8">
        <div className="container px-4 md:px-6">
          <h1 className="text-3xl font-bold tracking-tighter mb-8">Compare FMEAs</h1>
          <FMEAComparison />
        </div>
      </main>
      <Footer />
    </div>
  )
}
