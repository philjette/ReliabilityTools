"use client"

export function checkEnvironmentVariables() {
  if (typeof window === "undefined") {
    return {
      isServer: true,
      variables: {
        NEXT_PUBLIC_SUPABASE_URL: {
          exists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          type: typeof process.env.NEXT_PUBLIC_SUPABASE_URL,
          value: process.env.NEXT_PUBLIC_SUPABASE_URL
            ? `${process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 10)}...`
            : "Not set",
          issues: getIssues(process.env.NEXT_PUBLIC_SUPABASE_URL),
        },
        NEXT_PUBLIC_SUPABASE_ANON_KEY: {
          exists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          type: typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Value exists (hidden)" : "Not set",
          issues: getIssues(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
        },
      },
    }
  }

  return {
    isServer: false,
    variables: {
      NEXT_PUBLIC_SUPABASE_URL: {
        exists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        type: typeof process.env.NEXT_PUBLIC_SUPABASE_URL,
        value: process.env.NEXT_PUBLIC_SUPABASE_URL
          ? `${process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 10)}...`
          : "Not set",
        issues: getIssues(process.env.NEXT_PUBLIC_SUPABASE_URL),
      },
      NEXT_PUBLIC_SUPABASE_ANON_KEY: {
        exists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        type: typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Value exists (hidden)" : "Not set",
        issues: getIssues(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      },
    },
  }
}

function getIssues(value: string | undefined): string[] {
  const issues: string[] = []

  if (!value) {
    issues.push("Value is not set")
    return issues
  }

  // Check for common issues
  if (value.startsWith('"') && value.endsWith('"')) {
    issues.push("Value has extra quotes")
  }

  if (value.startsWith("'") && value.endsWith("'")) {
    issues.push("Value has extra single quotes")
  }

  if (value.includes(" ")) {
    issues.push("Value contains spaces")
  }

  if (value === "undefined" || value === "null") {
    issues.push(`Value is the string "${value}"`)
  }

  return issues
}
