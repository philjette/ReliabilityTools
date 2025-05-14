import { Skeleton } from "@/components/ui/skeleton"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function Loading() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header activePath="/dashboard" />
      <main className="flex-1 py-8">
        <div className="container px-4 md:px-6">
          <Skeleton className="h-10 w-64 mb-8" />
          <div className="grid gap-6">
            <Skeleton className="h-[600px] w-full" />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
