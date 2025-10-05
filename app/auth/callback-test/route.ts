import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  
  console.log("Callback test endpoint hit!")
  console.log("Full URL:", requestUrl.toString())
  console.log("All parameters:", Object.fromEntries(requestUrl.searchParams.entries()))
  
  return NextResponse.json({
    message: "Callback test successful",
    url: requestUrl.toString(),
    params: Object.fromEntries(requestUrl.searchParams.entries()),
    timestamp: new Date().toISOString()
  })
}
