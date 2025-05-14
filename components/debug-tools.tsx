"use client"

import { useEffect, useState } from "react"
import { EnvDebug } from "@/components/env-debug"
import { EnvSetupHelper } from "@/components/env-setup-helper"
import { AuthDebug } from "@/components/auth-debug"

export function DebugTools() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return null
  }

  return (
    <>
      <EnvSetupHelper />
      <EnvDebug />
      <AuthDebug />
    </>
  )
}
