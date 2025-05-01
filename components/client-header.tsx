"use client"

import { usePathname } from "next/navigation"
import { Header } from "./header"

export function ClientHeader() {
  const pathname = usePathname()
  return <Header activePath={pathname} />
}
