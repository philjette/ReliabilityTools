import { redirect, notFound } from "next/navigation"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { getFMEAById } from "@/lib/fmea-actions"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { SavedFMEAView } from "@/components/saved-fmea-view"

export const dynamic = "force-dynamic"

export default async function FMEADetailPage({ params }: { params: { id: string } }) {
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/auth/sign-in")
  }

  const fmea = await getFMEAById(params.id)

  if (!fmea) {
    notFound()
  }

  return (
    <>
      <Header />
      <SavedFMEAView fmea={fmea} />
      <Footer />
    </>
  )
}
