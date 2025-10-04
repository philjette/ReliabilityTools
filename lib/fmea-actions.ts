"use server"

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { generateFmeaPdf } from "@/lib/pdf-export"
import type { FailureMode } from "./actions"

export interface SavedFMEA {
  id: string
  user_id: string
  title: string
  asset_type: string
  voltage_rating: string
  operating_environment: string
  age_range: string
  load_profile: string
  asset_criticality: string
  additional_notes?: string
  failure_modes: FailureMode[]
  weibull_parameters: Record<string, { shape: number; scale: number }>
  created_at: string
  updated_at: string
}

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

export async function generateFMEA(
  assetType: string,
  voltageRating: string,
  operatingEnvironment: string,
  ageRange: string,
  loadProfile: string,
  assetCriticality: string,
  additionalNotes: string,
) {
  try {
    const prompt = `Generate a comprehensive FMEA (Failure Mode and Effects Analysis) for the following electrical asset:

Asset Type: ${assetType}
Voltage Rating: ${voltageRating}
Operating Environment: ${operatingEnvironment}
Age Range: ${ageRange}
Load Profile: ${loadProfile}
Asset Criticality: ${assetCriticality}
Additional Notes: ${additionalNotes}

Please provide a detailed FMEA with at least 5-8 failure modes. For each failure mode, include:
1. Failure Mode name
2. Description of the failure
3. Potential causes (list 2-3)
4. Effects of the failure (list 2-3)
5. Severity rating (1-10)
6. Occurrence rating (1-10)
7. Detection rating (1-10)
8. RPN (Risk Priority Number = Severity × Occurrence × Detection)
9. Recommended actions (list 2-3)
10. Maintenance actions with frequency

Format the response as a JSON object with the following structure:
{
  "failureModes": [
    {
      "name": "string",
      "description": "string",
      "causes": ["string", "string"],
      "effects": ["string", "string"],
      "severity": number,
      "occurrence": number,
      "detection": number,
      "recommendations": ["string", "string"],
      "maintenanceActions": [
        {
          "action": "string",
          "frequency": "string",
          "description": "string"
        }
      ]
    }
  ],
  "weibullParameters": {
    "FailureMode1": {"shape": number, "scale": number},
    "FailureMode2": {"shape": number, "scale": number}
  }
}

Ensure the ratings are realistic for electrical equipment and the RPN is calculated correctly.`

    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt,
      system:
        "You are an expert reliability engineer specializing in electrical transmission and distribution equipment. Provide accurate, professional FMEA analysis based on industry standards and best practices. Always respond with valid JSON.",
    })

    // Parse the JSON response
    const cleanedText = text.replace(/```json\n?|\n?```/g, "").trim()
    const result = JSON.parse(cleanedText)

    return {
      failureModes: result.failureModes || [],
      weibullParameters: result.weibullParameters || {},
    }
  } catch (error) {
    console.error("Error generating FMEA:", error)
    throw new Error("Failed to generate FMEA. Please try again.")
  }
}

export async function generatePdf(params: SaveFMEAParams): Promise<Uint8Array> {
  return generateFmeaPdf(params)
}

export async function saveFMEA(params: SaveFMEAParams): Promise<SavedFMEA> {
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    throw new Error("You must be signed in to save FMEAs")
  }

  const { data, error } = await supabase
    .from("fmeas")
    .insert({
      user_id: session.user.id,
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
    .single()

  if (error) {
    console.error("Error saving FMEA:", error)
    throw new Error(error.message)
  }

  return data
}

export async function getUserFMEAs(): Promise<SavedFMEA[]> {
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return []
  }

  const { data, error } = await supabase
    .from("fmeas")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching FMEAs:", error)
    return []
  }

  return data || []
}

export async function getFMEAById(id: string): Promise<SavedFMEA | null> {
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return null
  }

  const { data, error } = await supabase.from("fmeas").select("*").eq("id", id).eq("user_id", session.user.id).single()

  if (error) {
    console.error("Error fetching FMEA:", error)
    return null
  }

  return data
}

export async function deleteFMEA(id: string): Promise<void> {
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    throw new Error("You must be signed in to delete FMEAs")
  }

  const { error } = await supabase.from("fmeas").delete().eq("id", id).eq("user_id", session.user.id)

  if (error) {
    console.error("Error deleting FMEA:", error)
    throw new Error(error.message)
  }
}
