"use server"

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

export interface FMEAData {
  id?: string
  title: string
  asset_type: string
  voltage_rating: string
  operating_environment: string
  age_range: string
  load_profile: string
  asset_criticality: string
  additional_notes?: string
  failure_modes: Array<{
    name: string
    severity: number
    occurrence: number
    detection: number
    causes: string[]
    effects: string[]
    maintenanceActions?: Array<{
      action: string
      frequency: string
      description: string
    }>
  }>
  weibull_parameters?: Record<string, { shape: number; scale: number }>
  created_at?: string
  updated_at?: string
}

export async function saveFMEA(fmeaData: FMEAData) {
  try {
    const cookieStore = cookies()
    const supabase = createServerComponentClient({ cookies: () => cookieStore })

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "User not authenticated" }
    }

    const { data, error } = await supabase
      .from("fmeas")
      .insert({
        user_id: user.id,
        title: fmeaData.title,
        asset_type: fmeaData.asset_type,
        voltage_rating: fmeaData.voltage_rating,
        operating_environment: fmeaData.operating_environment,
        age_range: fmeaData.age_range,
        load_profile: fmeaData.load_profile,
        asset_criticality: fmeaData.asset_criticality,
        additional_notes: fmeaData.additional_notes,
        failure_modes: fmeaData.failure_modes,
        weibull_parameters: fmeaData.weibull_parameters || {},
      })
      .select()
      .single()

    if (error) {
      console.error("Error saving FMEA:", error)
      return { error: error.message }
    }

    return { data }
  } catch (error: any) {
    console.error("Unexpected error saving FMEA:", error)
    return { error: error.message || "Failed to save FMEA" }
  }
}

export async function getUserFMEAs() {
  try {
    const cookieStore = cookies()
    const supabase = createServerComponentClient({ cookies: () => cookieStore })

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: [], error: null }
    }

    const { data, error } = await supabase
      .from("fmeas")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching FMEAs:", error)
      return { data: [], error: error.message }
    }

    return { data: data || [], error: null }
  } catch (error: any) {
    console.error("Unexpected error fetching FMEAs:", error)
    return { data: [], error: error.message }
  }
}

export async function getFMEAById(id: string) {
  try {
    const cookieStore = cookies()
    const supabase = createServerComponentClient({ cookies: () => cookieStore })

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "User not authenticated", data: null }
    }

    const { data, error } = await supabase.from("fmeas").select("*").eq("id", id).eq("user_id", user.id).single()

    if (error) {
      console.error("Error fetching FMEA:", error)
      return { error: error.message, data: null }
    }

    return { data, error: null }
  } catch (error: any) {
    console.error("Unexpected error fetching FMEA:", error)
    return { error: error.message, data: null }
  }
}

export async function deleteFMEA(id: string) {
  try {
    const cookieStore = cookies()
    const supabase = createServerComponentClient({ cookies: () => cookieStore })

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "User not authenticated" }
    }

    const { error } = await supabase.from("fmeas").delete().eq("id", id).eq("user_id", user.id)

    if (error) {
      console.error("Error deleting FMEA:", error)
      return { error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Unexpected error deleting FMEA:", error)
    return { error: error.message }
  }
}

export async function generatePdf(fmeaData: FMEAData): Promise<Blob> {
  const doc = new jsPDF()

  // Title
  doc.setFontSize(20)
  doc.text("FMEA Report", 14, 20)

  // Asset Information
  doc.setFontSize(12)
  doc.text(`Asset: ${fmeaData.title}`, 14, 35)
  doc.text(`Type: ${fmeaData.asset_type}`, 14, 42)
  doc.text(`Voltage Rating: ${fmeaData.voltage_rating}`, 14, 49)
  doc.text(`Environment: ${fmeaData.operating_environment}`, 14, 56)
  doc.text(`Age Range: ${fmeaData.age_range}`, 14, 63)
  doc.text(`Load Profile: ${fmeaData.load_profile}`, 14, 70)
  doc.text(`Criticality: ${fmeaData.asset_criticality}`, 14, 77)

  // Additional notes if present
  if (fmeaData.additional_notes) {
    doc.text(`Notes: ${fmeaData.additional_notes}`, 14, 84)
  }

  // Failure Modes Table
  const tableData = fmeaData.failure_modes.map((mode) => [
    mode.name,
    mode.severity.toString(),
    mode.occurrence.toString(),
    mode.detection.toString(),
    (mode.severity * mode.occurrence * mode.detection).toString(),
  ])

  autoTable(doc, {
    startY: fmeaData.additional_notes ? 95 : 90,
    head: [["Failure Mode", "Severity", "Occurrence", "Detection", "RPN"]],
    body: tableData,
    theme: "striped",
    headStyles: { fillColor: [41, 128, 185] },
    styles: { fontSize: 10 },
  })

  // Add Weibull parameters if available
  if (fmeaData.weibull_parameters && Object.keys(fmeaData.weibull_parameters).length > 0) {
    const finalY = (doc as any).lastAutoTable.finalY || 90
    doc.setFontSize(14)
    doc.text("Weibull Parameters", 14, finalY + 15)

    const weibullData = Object.entries(fmeaData.weibull_parameters).map(([mode, params]) => [
      mode,
      params.shape.toFixed(2),
      params.scale.toFixed(2),
    ])

    autoTable(doc, {
      startY: finalY + 20,
      head: [["Failure Mode", "Shape (β)", "Scale (η)"]],
      body: weibullData,
      theme: "striped",
      headStyles: { fillColor: [41, 128, 185] },
      styles: { fontSize: 10 },
    })
  }

  return doc.output("blob")
}
