import type React from "react"
import "@/app/globals.css"

import type { Metadata } from "next"
import { Inter } from "next/font/google"

import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"
import { Toaster } from "@/components/ui/toaster"
import { AppContextProvider } from "../contexts/AppContext"

// Add this console log to check environment variables during server-side rendering
console.log("Server-side Environment Variables Check:", {
  NEXT_PUBLIC_SUPABASE_URL: typeof process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  URL_VALUE: process.env.NEXT_PUBLIC_SUPABASE_URL ? "Has value" : "No value",
  KEY_VALUE: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Has value" : "No value",
})

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
        <AppContextProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            <AuthProvider>{children}</AuthProvider>
            <Toaster />
          </ThemeProvider>
        </AppContextProvider>
      </body>
    </html>
  )
}
