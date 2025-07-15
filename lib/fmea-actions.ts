"use server"

import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { generateFmeaPdf } from "@/lib/pdf-export"

export interface FMEAConfig {
  assetType: string
  voltageRating: string
  operatingEnvironment: string
  ageRange: string
  loadProfile: string
  assetCriticality: string
  additionalNotes?: string
}

export interface FailureMode {
  name: string
  description: string
  severity: number
  occurrence: number
  detection: number
  causes: string[]
  effects: string[]
  recommendations: string[]
  maintenanceActions?: Array<{
    action: string
    frequency: string
    description: string
  }>
}

export interface FMEA {
  id: string
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

export async function generatePdfFromSaved(id: string): Promise<Uint8Array> {
  throw new Error("This functionality requires saved FMEAs which have been disabled.")
}

// Placeholder functions for removed database functionality
export async function saveFMEA(params: SaveFMEAParams) {
  throw new Error("Save functionality has been disabled. Use PDF export instead.")
}

export async function getUserFMEAs() {
  return []
}

export async function getFMEAById(id: string) {
  return null
}

export async function deleteFMEA(id: string) {
  throw new Error("Delete functionality has been disabled.")
}
