"use server"

import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export interface MaintenanceAction {
  action: string
  frequency: string
  description: string
}

export interface FailureMode {
  name: string
  description: string
  causes?: string[]
  effects?: string[]
  severity: number
  occurrence: number
  detection: number
  recommendations?: string[]
  maintenanceActions?: MaintenanceAction[]
}

export interface FMEAResult {
  failureModes: FailureMode[]
  weibullParameters: Record<string, { shape: number; scale: number }>
}

const fallbackData: Record<string, FMEAResult> = {
  transformer: {
    failureModes: [
      {
        name: "Winding Insulation Failure",
        description: "Degradation of insulation leading to short circuits",
        causes: ["Thermal stress", "Moisture ingress", "Age-related degradation"],
        effects: ["Complete transformer failure", "Fire hazard", "Extended outage"],
        severity: 9,
        occurrence: 5,
        detection: 6,
        recommendations: ["Regular oil testing", "Thermal imaging", "Partial discharge monitoring"],
        maintenanceActions: [
          {
            action: "Oil quality analysis",
            frequency: "Annually",
            description: "Test dielectric strength and dissolved gas analysis",
          },
          {
            action: "Thermal scanning",
            frequency: "Quarterly",
            description: "Infrared inspection of bushings and connections",
          },
        ],
      },
      {
        name: "Bushing Failure",
        description: "Cracking or flashover of high voltage bushings",
        causes: ["Environmental stress", "Manufacturing defect", "Electrical overstress"],
        effects: ["Phase-to-ground fault", "Equipment damage", "Safety hazard"],
        severity: 8,
        occurrence: 4,
        detection: 5,
        recommendations: ["Visual inspections", "Power factor testing", "Oil level monitoring"],
        maintenanceActions: [
          {
            action: "Visual inspection",
            frequency: "Monthly",
            description: "Check for cracks, oil leaks, and contamination",
          },
          {
            action: "Power factor test",
            frequency: "Every 2 years",
            description: "Measure insulation condition",
          },
        ],
      },
      {
        name: "Tap Changer Mechanism Failure",
        description: "Mechanical or electrical failure of on-load tap changer",
        causes: ["Contact wear", "Drive mechanism failure", "Control circuit issues"],
        effects: ["Loss of voltage regulation", "Arcing", "Potential fire"],
        severity: 7,
        occurrence: 6,
        detection: 4,
        recommendations: ["Contact inspection", "Motor testing", "Oil filtration"],
        maintenanceActions: [
          {
            action: "Contact inspection",
            frequency: "Every 3 years",
            description: "Inspect and measure contact resistance",
          },
          {
            action: "Oil filtration",
            frequency: "Annually",
            description: "Filter and test tap changer oil",
          },
        ],
      },
    ],
    weibullParameters: {
      "Winding Insulation Failure": { shape: 2.5, scale: 262800 },
      "Bushing Failure": { shape: 1.8, scale: 350400 },
      "Tap Changer Mechanism Failure": { shape: 3.2, scale: 175200 },
    },
  },
  "circuit-breaker": {
    failureModes: [
      {
        name: "Contact Erosion",
        description: "Degradation of electrical contacts due to arcing",
        causes: ["Repeated switching operations", "High fault currents", "Insufficient maintenance"],
        effects: ["Increased resistance", "Overheating", "Failure to interrupt"],
        severity: 8,
        occurrence: 7,
        detection: 5,
        recommendations: ["Contact resistance testing", "Operation counter monitoring", "Contact inspection"],
        maintenanceActions: [
          {
            action: "Contact resistance measurement",
            frequency: "Annually",
            description: "Measure and record contact resistance",
          },
          {
            action: "Mechanism lubrication",
            frequency: "Every 2 years",
            description: "Lubricate operating mechanism",
          },
        ],
      },
      {
        name: "Operating Mechanism Failure",
        description: "Mechanical failure preventing proper operation",
        causes: ["Lack of lubrication", "Spring fatigue", "Linkage wear"],
        effects: ["Failure to close or open", "Slow operation", "Safety interlock bypass"],
        severity: 9,
        occurrence: 4,
        detection: 6,
        recommendations: ["Timing tests", "Mechanical inspection", "Spring tension checks"],
        maintenanceActions: [
          {
            action: "Timing test",
            frequency: "Annually",
            description: "Verify opening/closing times within specifications",
          },
          {
            action: "Spring inspection",
            frequency: "Every 5 years",
            description: "Inspect and test closing/opening springs",
          },
        ],
      },
      {
        name: "Insulation Breakdown",
        description: "Failure of internal insulation system",
        causes: ["Contamination", "Moisture ingress", "Electrical stress"],
        effects: ["Phase-to-ground fault", "Explosion risk", "Complete failure"],
        severity: 10,
        occurrence: 3,
        detection: 7,
        recommendations: ["SF6 gas monitoring", "Partial discharge testing", "Dew point measurement"],
        maintenanceActions: [
          {
            action: "SF6 gas analysis",
            frequency: "Semi-annually",
            description: "Check gas purity and pressure",
          },
          {
            action: "Partial discharge test",
            frequency: "Every 3 years",
            description: "Detect internal insulation defects",
          },
        ],
      },
    ],
    weibullParameters: {
      "Contact Erosion": { shape: 3.5, scale: 131400 },
      "Operating Mechanism Failure": { shape: 2.1, scale: 262800 },
      "Insulation Breakdown": { shape: 1.5, scale: 438000 },
    },
  },
}

export async function generateFMEA(
  assetType: string,
  voltageRating: string,
  operatingEnvironment: string,
  ageRange: string,
  loadProfile: string,
  assetCriticality: string,
  additionalNotes?: string,
): Promise<FMEAResult> {
  try {
    const prompt = `Generate a comprehensive FMEA (Failure Mode and Effects Analysis) for the following electrical asset:

Asset Type: ${assetType}
Voltage Rating: ${voltageRating}
Operating Environment: ${operatingEnvironment}
Age Range: ${ageRange}
Load Profile: ${loadProfile}
Asset Criticality: ${assetCriticality}
${additionalNotes ? `Additional Notes: ${additionalNotes}` : ""}

Provide 3-5 failure modes with:
1. Name and description of the failure mode
2. Causes (array of strings)
3. Effects (array of strings)
4. Severity rating (1-10)
5. Occurrence rating (1-10)
6. Detection rating (1-10)
7. Recommendations (array of strings)
8. Maintenance actions with action name, frequency, and description
9. Weibull parameters (shape and scale in hours)

Return the response in JSON format matching this structure:
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
    "Failure Mode Name": {
      "shape": number,
      "scale": number
    }
  }
}`

    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt,
      temperature: 0.7,
      maxTokens: 3000,
    })

    // Parse the JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("Could not parse JSON from response")
    }

    const result: FMEAResult = JSON.parse(jsonMatch[0])
    return result
  } catch (error) {
    console.error("Error generating FMEA:", error)

    // Return fallback data
    const fallbackKey = Object.keys(fallbackData).find((key) => assetType.toLowerCase().includes(key))
    if (fallbackKey) {
      return fallbackData[fallbackKey]
    }

    // If no fallback matches, return transformer data as default
    return fallbackData.transformer
  }
}
