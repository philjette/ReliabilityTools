"use server"

import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export interface FailureMode {
  name: string
  description: string
  causes?: string[]
  effects?: string[]
  severity: number
  occurrence: number
  detection: number
  recommendations?: string[]
  maintenanceActions?: Array<{
    action: string
    description: string
    frequency: string
  }>
}

export interface FMEAResult {
  failureModes: FailureMode[]
  weibullParameters: Record<string, { shape: number; scale: number }>
  summary?: string
}

export async function generateFMEA(
  assetType: string,
  voltageRating: string,
  operatingEnvironment: string,
  ageRange: string,
  loadProfile: string,
  assetCriticality: string,
  additionalNotes = "",
): Promise<FMEAResult> {
  try {
    const prompt = `Generate a detailed FMEA (Failure Mode and Effects Analysis) for the following electrical asset:

Asset Type: ${assetType}
Voltage Rating: ${voltageRating}
Operating Environment: ${operatingEnvironment}
Age Range: ${ageRange}
Load Profile: ${loadProfile}
Asset Criticality: ${assetCriticality}
${additionalNotes ? `Additional Notes: ${additionalNotes}` : ""}

For each failure mode, provide:
1. Failure mode name and description
2. Potential causes (as an array)
3. Effects on the system (as an array)
4. Severity rating (1-10, where 10 is most severe)
5. Occurrence rating (1-10, where 10 is most frequent)
6. Detection rating (1-10, where 10 is hardest to detect)
7. Recommended preventive actions (as an array)
8. Maintenance actions with frequency (as an array of objects with action, description, and frequency)
9. Weibull distribution parameters (shape and scale in hours) based on typical failure patterns

Provide at least 5 relevant failure modes. Format the response as valid JSON with this structure:
{
  "failureModes": [
    {
      "name": "string",
      "description": "string",
      "causes": ["string"],
      "effects": ["string"],
      "severity": number,
      "occurrence": number,
      "detection": number,
      "recommendations": ["string"],
      "maintenanceActions": [{"action": "string", "description": "string", "frequency": "string"}]
    }
  ],
  "weibullParameters": {
    "FailureModeName": {"shape": number, "scale": number}
  },
  "summary": "string"
}`

    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt,
      temperature: 0.7,
      maxTokens: 4000,
    })

    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("Failed to parse FMEA response")
    }

    const result = JSON.parse(jsonMatch[0]) as FMEAResult
    return result
  } catch (error) {
    console.error("Error generating FMEA:", error)

    // Return fallback data
    return {
      failureModes: [
        {
          name: "Insulation Breakdown",
          description: "Degradation of insulation material leading to electrical failure",
          causes: ["Thermal stress", "Environmental contamination", "Electrical overstress"],
          effects: ["Short circuit", "Equipment damage", "Service interruption"],
          severity: 9,
          occurrence: 4,
          detection: 6,
          recommendations: ["Regular insulation testing", "Temperature monitoring", "Visual inspections"],
          maintenanceActions: [
            {
              action: "Insulation Resistance Test",
              description: "Measure insulation resistance using megohmmeter",
              frequency: "Annually",
            },
            {
              action: "Thermographic Survey",
              description: "Infrared inspection to detect hot spots",
              frequency: "Semi-annually",
            },
          ],
        },
        {
          name: "Mechanical Wear",
          description: "Physical degradation of moving parts or connections",
          causes: ["Normal wear and tear", "Vibration", "Improper installation"],
          effects: ["Poor electrical contact", "Overheating", "Equipment failure"],
          severity: 7,
          occurrence: 5,
          detection: 5,
          recommendations: ["Scheduled maintenance", "Vibration monitoring", "Torque verification"],
          maintenanceActions: [
            {
              action: "Connection Inspection",
              description: "Visual and thermal inspection of all connections",
              frequency: "Quarterly",
            },
          ],
        },
      ],
      weibullParameters: {
        "Insulation Breakdown": { shape: 2.5, scale: 87600 },
        "Mechanical Wear": { shape: 1.8, scale: 52560 },
      },
      summary: "FMEA analysis completed with fallback data due to API error.",
    }
  }
}
