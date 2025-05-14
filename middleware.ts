import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Log all navigation attempts to dashboard
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    console.log("Dashboard navigation attempt:", {
      url: request.nextUrl.toString(),
      headers: Object.fromEntries(request.headers),
      cookies: Object.fromEntries(request.cookies),
    })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*"],
}
