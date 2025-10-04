"use server"

import { createClient } from "@/lib/supabase-client"
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
  weibull_parameters: Record<string, { shape: number; scale: number }>
  created_at?: string
  updated_at?: string
}

export async function saveFMEA(fmeaData: FMEAData) {
  const supabase = createClient()

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
      weibull_parameters: fmeaData.weibull_parameters,
    })
    .select()
    .single()

  if (error) {
    console.error("Error saving FMEA:", error)
    return { error: error.message }
  }

  return { data }
}

export async function getUserFMEAs() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "User not authenticated" }
  }

  const { data, error } = await supabase
    .from("fmeas")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching FMEAs:", error)
    return { error: error.message }
  }

  return { data }
}

export async function getFMEAById(id: string) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "User not authenticated" }
  }

  const { data, error } = await supabase.from("fmeas").select("*").eq("id", id).eq("user_id", user.id).single()

  if (error) {
    console.error("Error fetching FMEA:", error)
    return { error: error.message }
  }

  return { data }
}

export async function deleteFMEA(id: string) {
  const supabase = createClient()

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

  // Failure Modes Table
  const tableData = fmeaData.failure_modes.map((mode) => [
    mode.name,
    mode.severity.toString(),
    mode.occurrence.toString(),
    mode.detection.toString(),
    (mode.severity * mode.occurrence * mode.detection).toString(),
  ])

  autoTable(doc, {
    startY: 90,
    head: [["Failure Mode", "Severity", "Occurrence", "Detection", "RPN"]],
    body: tableData,
  })

  return doc.output("blob")
}
