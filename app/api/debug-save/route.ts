import { type NextRequest, NextResponse } from "next/server"
import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    console.log("=== Debug Save API Endpoint ===")

    const body = await request.json()
    console.log("Request body received:", {
      title: body.title,
      hasFailureModes: !!body.failureModes,
      failureModesCount: body.failureModes?.length || 0,
    })

    // Test environment variables
    console.log("Environment variables:")
    console.log("NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "Present" : "Missing")
    console.log("NEXT_PUBLIC_SUPABASE_ANON_KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Present" : "Missing")

    // Test Supabase client creation
    console.log("Creating Supabase client...")
    const supabase = createServerActionClient({ cookies })
    console.log("Supabase client created successfully")

    // Test authentication
    console.log("Testing authentication...")
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      console.error("Auth error:", userError)
      return NextResponse.json({
        success: false,
        error: "Authentication failed",
        details: userError.message,
      })
    }

    if (!user) {
      console.error("No user found")
      return NextResponse.json({
        success: false,
        error: "No authenticated user",
      })
    }

    console.log("User authenticated:", { id: user.id, email: user.email })

    // Test database connection
    console.log("Testing database connection...")
    const { data: testData, error: testError } = await supabase.from("fmeas").select("count").limit(1)

    if (testError) {
      console.error("Database test error:", testError)
      return NextResponse.json({
        success: false,
        error: "Database connection failed",
        details: testError.message,
      })
    }

    console.log("Database connection successful")

    // Test data preparation
    console.log("Testing data preparation...")
    const fmeaData = {
      user_id: user.id,
      title: body.title || "Test FMEA",
      asset_type: body.assetType || "",
      voltage_rating: body.voltageRating || "",
      operating_environment: body.operatingEnvironment || "",
      age_range: body.ageRange || "",
      load_profile: body.loadProfile || "",
      asset_criticality: body.assetCriticality || "",
      additional_notes: body.additionalNotes || "",
      failure_modes: body.failureModes || [],
      weibull_parameters: body.weibullParameters || {},
    }

    console.log("Data prepared:", {
      user_id: fmeaData.user_id,
      title: fmeaData.title,
      failure_modes_count: fmeaData.failure_modes.length,
    })

    // Test actual insert
    console.log("Testing database insert...")
    const { data, error } = await supabase.from("fmeas").insert(fmeaData).select().single()

    if (error) {
      console.error("Insert error:", error)
      return NextResponse.json({
        success: false,
        error: "Database insert failed",
        details: error.message,
        code: error.code,
      })
    }

    console.log("Insert successful:", data.id)

    return NextResponse.json({
      success: true,
      message: "FMEA saved successfully",
      id: data.id,
    })
  } catch (error) {
    console.error("=== Debug Save API Error ===")
    console.error("Error type:", typeof error)
    console.error("Error message:", error instanceof Error ? error.message : "Unknown error")
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack")

    return NextResponse.json({
      success: false,
      error: "Server error",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
