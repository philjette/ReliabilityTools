"use server"

import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { generateFmeaPdf } from "@/lib/pdf-export"
import type { FailureMode } from "@/lib/actions"

interface GenerateFMEAParams {
  assetName: string
  assetType: string
  voltageRating: string
  operatingEnvironment: string
  loadProfile: string
  additionalContext: string
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

export async function generateFMEA(params: GenerateFMEAParams) {
  try {
    const prompt = `Generate a comprehensive FMEA (Failure Mode and Effects Analysis) for the following electrical asset:

Asset Name: ${params.assetName}
Asset Type: ${params.assetType}
Voltage Rating: ${params.voltageRating}
Operating Environment: ${params.operatingEnvironment}
Load Profile: ${params.loadProfile}
Additional Context: ${params.additionalContext}

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

Format the response as a JSON array of objects with the following structure:
{
  "failureMode": "string",
  "description": "string",
  "causes": ["string", "string"],
  "effects": ["string", "string"],
  "severity": number,
  "occurrence": number,
  "detection": number,
  "rpn": number,
  "recommendedActions": ["string", "string"]
}

Ensure the ratings are realistic for electrical equipment and the RPN is calculated correctly.`

    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt,
      system:
        "You are an expert reliability engineer specializing in electrical transmission and distribution equipment. Provide accurate, professional FMEA analysis based on industry standards and best practices.",
    })

    // Parse the JSON response
    const cleanedText = text.replace(/```json\n?|\n?```/g, "").trim()
    const fmeaResults = JSON.parse(cleanedText)

    return {
      success: true,
      data: fmeaResults,
    }
  } catch (error) {
    console.error("Error generating FMEA:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

export async function generatePdf(params: SaveFMEAParams): Promise<Uint8Array> {
  return generateFmeaPdf(params)
}

// Placeholder functions for database operations (since we removed authentication)
export async function saveFMEA(params: SaveFMEAParams) {
  // Since we removed authentication and database functionality,
  // this function is a placeholder that throws an error
  throw new Error("Save functionality has been disabled. Use PDF export instead.")
}

export async function getUserFMEAs() {
  // Since we removed authentication and database functionality,
  // this function returns an empty array
  return []
}

export async function getFMEAById(id: string) {
  // Since we removed authentication and database functionality,
  // this function returns null
  return null
}

export async function deleteFMEA(id: string) {
  // Since we removed authentication and database functionality,
  // this function throws an error
  throw new Error("Delete functionality has been disabled.")
}

export async function generatePdfFromSaved(id: string): Promise<Uint8Array> {
  // Since we removed authentication and database functionality,
  // this function throws an error
  throw new Error("This functionality requires saved FMEAs which have been disabled.")
}
