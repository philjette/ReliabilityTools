import { redirect } from "next/navigation"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { getUserFMEAs } from "@/lib/fmea-actions"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { SavedFMEAsList } from "@/components/saved-fmeas-list"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/auth/sign-in")
  }

  const fmeas = await getUserFMEAs()

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My FMEAs</h1>
            <p className="mt-2 text-gray-600">View and manage your saved FMEA analyses</p>
          </div>
          <SavedFMEAsList fmeas={fmeas} />
        </div>
      </div>
      <Footer />
    </>
  )
}
