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
  severity: number
  occurrence: number
  detection: number
  causes: string[]
  effects: string[]
  recommendations: string[]
  maintenanceActions: MaintenanceAction[]
}

export interface FMEAResult {
  failureModes: FailureMode[]
  weibullParameters: {
    [key: string]: {
      shape: number
      scale: number
    }
  }
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
    // Create a detailed prompt for the OpenAI model
    const prompt = `
      Generate a comprehensive Failure Mode and Effects Analysis (FMEA) for an electrical transmission and distribution asset with the following characteristics:
      
      Asset Type: ${assetType}
      Voltage Rating: ${voltageRating}
      Operating Environment: ${operatingEnvironment}
      Asset Age: ${ageRange}
      Load Profile: ${loadProfile}
      Asset Criticality: ${assetCriticality}
      Additional Notes: ${additionalNotes || "None"}
      
      For each failure mode, provide:
      1. Name of the failure mode
      2. Detailed description
      3. Severity rating (1-10)
      4. Occurrence rating (1-10)
      5. Detection rating (1-10)
      6. Potential causes
      7. Effects on the system
      8. Recommended actions
      9. Preventative maintenance actions with recommended frequencies based on the asset criticality
      10. Weibull distribution parameters (shape and scale) that would be appropriate for this failure mode
      
      The maintenance frequencies should be appropriate for the asset criticality:
      - High criticality assets should have more frequent and thorough maintenance
      - Medium criticality assets should have moderate maintenance frequencies
      - Low criticality assets can have less frequent maintenance
      
      Provide at least 5 failure modes specific to this asset type and operating conditions.
      
      IMPORTANT: Your response must be a valid JSON object with no markdown formatting, no code blocks, and no backticks. 
      The response should be a raw JSON object that can be directly parsed with JSON.parse().
      
      The JSON structure should be:
      {
        "failureModes": [
          {
            "name": "Failure Mode Name",
            "description": "Detailed description",
            "severity": 7,
            "occurrence": 5,
            "detection": 4,
            "causes": ["Cause 1", "Cause 2"],
            "effects": ["Effect 1", "Effect 2"],
            "recommendations": ["Recommendation 1", "Recommendation 2"],
            "maintenanceActions": [
              {
                "action": "Maintenance Action 1",
                "frequency": "Every 6 months",
                "description": "Details about the maintenance action"
              },
              {
                "action": "Maintenance Action 2",
                "frequency": "Annually",
                "description": "Details about the maintenance action"
              }
            ]
          }
        ],
        "weibullParameters": {
          "Failure Mode Name": {
            "shape": 2.5,
            "scale": 15000
          }
        }
      }
      
      Ensure the Weibull parameters are realistic for the failure mode:
      - Shape parameter (β) should be between 0.5 and 5
        - β < 1 for early life failures
        - β = 1 for random failures
        - β > 1 for wear-out failures
      - Scale parameter (η) should be in hours and represent the characteristic life (when 63.2% of units fail)
        - For electrical equipment, this is typically between 5,000 and 50,000 hours depending on the component
    `

    // Call OpenAI API using AI SDK
    const { text } = await generateText({
      model: openai("gpt-4o", { apiKey: process.env.OPENAI_API_KEY }),
      prompt: prompt,
      temperature: 0.7,
      maxTokens: 3000,
    })

    // Clean the response to extract valid JSON
    const cleanedResponse = cleanJsonResponse(text)

    // Parse the response as JSON
    try {
      const result = JSON.parse(cleanedResponse) as FMEAResult
      return result
    } catch (parseError) {
      console.error("Error parsing OpenAI response:", parseError)
      console.error("Raw response:", text)
      console.error("Cleaned response:", cleanedResponse)
      // If parsing fails, return a fallback response
      return getFallbackFMEA(assetType, assetCriticality)
    }
  } catch (error) {
    console.error("Error generating FMEA:", error)
    // Return fallback data if the API call fails
    return getFallbackFMEA(assetType, assetCriticality)
  }
}

// Function to clean the response and extract valid JSON
function cleanJsonResponse(text: string): string {
  // Remove markdown code block formatting if present
  let cleaned = text.trim()

  // Remove markdown code blocks with ```json and ``` if present
  const jsonBlockRegex = /```json\s*([\s\S]*?)\s*```/
  const match = cleaned.match(jsonBlockRegex)
  if (match && match[1]) {
    return match[1].trim()
  }

  // Remove any other code block formatting
  const codeBlockRegex = /```\s*([\s\S]*?)\s*```/
  const codeMatch = cleaned.match(codeBlockRegex)
  if (codeMatch && codeMatch[1]) {
    return codeMatch[1].trim()
  }

  // If the response starts with a backtick but doesn't properly close it,
  // try to find the JSON object within the text
  if (cleaned.startsWith("`") || cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^`+/, "").replace(/`+$/, "")
  }

  // Look for JSON-like structure starting with { and ending with }
  const jsonRegex = /\{[\s\S]*\}/
  const jsonMatch = cleaned.match(jsonRegex)
  if (jsonMatch) {
    return jsonMatch[0]
  }

  return cleaned
}

// Fallback function to return predefined FMEA data if the API call fails
function getFallbackFMEA(assetType: string, assetCriticality: string): FMEAResult {
  // Determine maintenance frequency based on criticality
  const getFrequency = (baseMonths: number): string => {
    switch (assetCriticality) {
      case "high":
        return `Every ${Math.max(1, Math.floor(baseMonths / 2))} months`
      case "medium":
        return `Every ${baseMonths} months`
      case "low":
        return `Every ${baseMonths * 2} months`
      default:
        return `Every ${baseMonths} months`
    }
  }

  // Basic fallback data based on asset type
  const fallbackData: { [key: string]: FMEAResult } = {
    transformer: {
      failureModes: [
        {
          name: "Insulation Breakdown",
          description:
            "Degradation of paper insulation due to thermal stress, moisture ingress, or electrical stress leading to internal short circuits.",
          severity: 9,
          occurrence: 5,
          detection: 4,
          causes: ["Thermal aging", "Moisture ingress", "Electrical overstress"],
          effects: ["Internal short circuit", "Catastrophic failure", "Fire risk"],
          recommendations: ["Regular oil testing", "Moisture monitoring", "Temperature monitoring"],
          maintenanceActions: [
            {
              action: "Oil Sample Analysis",
              frequency: getFrequency(6),
              description: "Test oil for dissolved gas, moisture content, and dielectric strength",
            },
            {
              action: "Thermographic Inspection",
              frequency: getFrequency(12),
              description: "Inspect for hotspots indicating potential insulation issues",
            },
            {
              action: "Winding Resistance Test",
              frequency: getFrequency(24),
              description: "Measure winding resistance to detect insulation degradation",
            },
          ],
        },
        {
          name: "Bushing Failure",
          description: "Cracking, contamination, or moisture ingress in bushings leading to flashover or explosion.",
          severity: 8,
          occurrence: 6,
          detection: 3,
          causes: ["External contamination", "Internal partial discharge", "Moisture ingress"],
          effects: ["External flashover", "Oil leakage", "Fire risk"],
          recommendations: ["Regular visual inspection", "Partial discharge monitoring", "Thermographic inspection"],
          maintenanceActions: [
            {
              action: "Visual Inspection",
              frequency: getFrequency(3),
              description: "Check for cracks, contamination, and oil leaks",
            },
            {
              action: "Power Factor Testing",
              frequency: getFrequency(12),
              description: "Measure power factor to detect internal degradation",
            },
            {
              action: "Bushing Cleaning",
              frequency: getFrequency(12),
              description: "Clean external surfaces to remove contamination",
            },
          ],
        },
      ],
      weibullParameters: {
        "Insulation Breakdown": {
          shape: 3.2,
          scale: 25000,
        },
        "Bushing Failure": {
          shape: 2.8,
          scale: 20000,
        },
      },
    },
    circuit_breaker: {
      failureModes: [
        {
          name: "Operating Mechanism Failure",
          description: "Mechanical failure in the operating mechanism preventing proper opening or closing operations.",
          severity: 8,
          occurrence: 6,
          detection: 4,
          causes: ["Mechanical wear", "Lubrication issues", "Spring fatigue"],
          effects: ["Failure to open on command", "Failure to close on command", "Slow operation"],
          recommendations: ["Regular mechanism testing", "Lubrication program", "Operational counter monitoring"],
          maintenanceActions: [
            {
              action: "Mechanism Lubrication",
              frequency: getFrequency(12),
              description: "Apply lubricant to moving parts according to manufacturer specifications",
            },
            {
              action: "Timing Test",
              frequency: getFrequency(24),
              description: "Measure opening and closing times to detect mechanism issues",
            },
            {
              action: "Trip-Close Operation Test",
              frequency: getFrequency(6),
              description: "Perform trip and close operations to verify proper functioning",
            },
          ],
        },
        {
          name: "Contact Erosion",
          description:
            "Erosion of main contacts due to arcing during interruption leading to increased contact resistance.",
          severity: 7,
          occurrence: 7,
          detection: 5,
          causes: ["Normal wear from interruption", "Fault current interruption", "Misalignment"],
          effects: ["Increased contact resistance", "Overheating", "Failure to interrupt"],
          recommendations: ["Contact resistance testing", "Operational counter monitoring", "Thermographic inspection"],
          maintenanceActions: [
            {
              action: "Contact Resistance Measurement",
              frequency: getFrequency(12),
              description: "Measure resistance across closed contacts to detect erosion",
            },
            {
              action: "Visual Inspection",
              frequency: getFrequency(24),
              description: "Inspect contacts for erosion and alignment (requires breaker disassembly)",
            },
            {
              action: "Thermographic Inspection",
              frequency: getFrequency(6),
              description: "Detect hotspots indicating high resistance connections",
            },
          ],
        },
      ],
      weibullParameters: {
        "Operating Mechanism Failure": {
          shape: 2.8,
          scale: 15000,
        },
        "Contact Erosion": {
          shape: 3.0,
          scale: 12000,
        },
      },
    },
    // Default fallback for other asset types
    default: {
      failureModes: [
        {
          name: "Generic Failure Mode 1",
          description: "Generic description of failure mode 1.",
          severity: 7,
          occurrence: 6,
          detection: 5,
          causes: ["Generic cause 1", "Generic cause 2"],
          effects: ["Generic effect 1", "Generic effect 2"],
          recommendations: ["Generic recommendation 1", "Generic recommendation 2"],
          maintenanceActions: [
            {
              action: "Routine Inspection",
              frequency: getFrequency(6),
              description: "General visual inspection of the asset",
            },
            {
              action: "Functional Testing",
              frequency: getFrequency(12),
              description: "Test the functionality of the asset",
            },
          ],
        },
        {
          name: "Generic Failure Mode 2",
          description: "Generic description of failure mode 2.",
          severity: 6,
          occurrence: 7,
          detection: 5,
          causes: ["Generic cause 1", "Generic cause 2"],
          effects: ["Generic effect 1", "Generic effect 2"],
          recommendations: ["Generic recommendation 1", "Generic recommendation 2"],
          maintenanceActions: [
            {
              action: "Preventive Maintenance",
              frequency: getFrequency(12),
              description: "Perform standard preventive maintenance",
            },
            {
              action: "Component Replacement",
              frequency: getFrequency(36),
              description: "Replace wear-prone components",
            },
          ],
        },
      ],
      weibullParameters: {
        "Generic Failure Mode 1": {
          shape: 2.5,
          scale: 15000,
        },
        "Generic Failure Mode 2": {
          shape: 2.0,
          scale: 12000,
        },
      },
    },
  }

  return fallbackData[assetType] || fallbackData.default
}
