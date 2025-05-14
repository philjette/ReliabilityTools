import type React from "react"
import { Footer } from "@/components/footer"
import { ClientHeader } from "@/components/client-header"
import ClientLayout from "./clientLayout"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClientLayout>
      <div className="flex flex-col min-h-screen">
        <ClientHeader activePath="/dashboard" />
        {children}
        <Footer />
      </div>
    </ClientLayout>
  )
}
