"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ClientCurveDetail } from "@/components/client-curve-detail"

export const dynamic = "force-dynamic"

export default function CurveDetailPage({ params }: { params: { id: string } }) {
  return <ClientCurveDetail curveId={params.id} />
}
