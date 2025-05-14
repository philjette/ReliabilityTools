import type React from "react"
import "@/app/globals.css"

import type { Metadata } from "next"
import { Inter } from "next/font/google"

import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"
import { AppContextProvider } from "@/contexts/AppContext"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "AssetX.pro - AI-Enabled FMEA Generation & Weibull Analysis",
  description: "Advanced asset reliability management platform for FMEA generation and failure analysis",
    generator: 'v0.dev'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <AppContextProvider>
            <AuthProvider>{children}</AuthProvider>
          </AppContextProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
