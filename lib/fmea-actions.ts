"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import type { FailureMode } from "@/lib/actions"
import { generateFmeaPdf } from "@/lib/pdf-export"

interface SaveFMEAParams {
  title: string
  assetType: string
  voltageRating: string
  operatingEnvironment: string
  ageRange: string
  loadProfile: string
  assetCriticality: string
  additionalNotes: string
  failureModes: FailureMode[]
  weibullParameters: Record<string, { shape: number; scale: number }>
}

export async function saveFMEA(params: SaveFMEAParams) {
  try {
    const supabase = createServerActionClient({ cookies })

    // Get the current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error("User not authenticated")
    }

    // Insert the FMEA into the database
    const { data, error } = await supabase
      .from("fmeas")
      .insert({
        user_id: user.id,
        title: params.title,
        asset_type: params.assetType,
        voltage_rating: params.voltageRating,
        operating_environment: params.operatingEnvironment,
        age_range: params.ageRange,
        load_profile: params.loadProfile,
        asset_criticality: params.assetCriticality,
        additional_notes: params.additionalNotes,
        failure_modes: params.failureModes,
        weibull_parameters: params.weibullParameters,
      })
      .select()

    if (error) {
      console.error("Error saving FMEA:", error)
      throw new Error(`Failed to save FMEA: ${error.message}`)
    }

    // Revalidate the dashboard path to show the new FMEA
    revalidatePath("/dashboard")

    return data[0]
  } catch (error) {
    console.error("Error in saveFMEA:", error)
    throw error
  }
}

export async function getUserFMEAs() {
  try {
    const supabase = createServerActionClient({ cookies })

    // Get the current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return []
    }

    // Get all FMEAs for the current user
    const { data, error } = await supabase.from("fmeas").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching FMEAs:", error)
      throw new Error(`Failed to fetch FMEAs: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error("Error in getUserFMEAs:", error)
    return []
  }
}

export async function getFMEAById(id: string) {
  try {
    const supabase = createServerActionClient({ cookies })

    // Get the FMEA by ID
    const { data, error } = await supabase.from("fmeas").select("*").eq("id", id).single()

    if (error) {
      console.error("Error fetching FMEA:", error)
      throw new Error(`Failed to fetch FMEA: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error("Error in getFMEAById:", error)
    return null
  }
}

export async function deleteFMEA(id: string) {
  try {
    const supabase = createServerActionClient({ cookies })

    // Delete the FMEA
    const { error } = await supabase.from("fmeas").delete().eq("id", id)

    if (error) {
      console.error("Error deleting FMEA:", error)
      throw new Error(`Failed to delete FMEA: ${error.message}`)
    }

    // Revalidate the dashboard path to update the list
    revalidatePath("/dashboard")

    return true
  } catch (error) {
    console.error("Error in deleteFMEA:", error)
    throw error
  }
}

export async function generatePdf(params: SaveFMEAParams): Promise<Uint8Array> {
  return generateFmeaPdf(params)
}

export async function generatePdfFromSaved(id: string): Promise<Uint8Array> {
  const fmea = await getFMEAById(id)

  if (!fmea) {
    throw new Error("FMEA not found")
  }

  return generateFmeaPdf({
    title: fmea.title,
    assetType: fmea.asset_type,
    voltageRating: fmea.voltage_rating,
    operatingEnvironment: fmea.operating_environment,
    ageRange: fmea.age_range,
    loadProfile: fmea.load_profile,
    assetCriticality: fmea.asset_criticality,
    additionalNotes: fmea.additional_notes,
    failureModes: fmea.failure_modes,
    weibullParameters: fmea.weibull_parameters,
    createdAt: fmea.created_at,
  })
}
