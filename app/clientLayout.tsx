import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/contexts/auth-context"
import { AppProvider } from "@/contexts/AppContext"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { usePathname } from "next/navigation"

const inter = Inter({ subsets: ["latin"] })

function ClientHeader() {
  "use client"

  const pathname = usePathname()
  return <Header activePath={pathname} />
}

export default function ClientRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <AuthProvider>
            <AppProvider>
              <div className="flex min-h-screen flex-col">
                <ClientHeader />
                <main className="flex-1">{children}</main>
                <Footer />
              </div>
              <Toaster />
            </AppProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
