export function checkEnvironmentVariables() {
  const isServer = typeof window === "undefined"

  const checkVariable = (name: string, value: any) => {
    const exists = value !== undefined && value !== null
    const type = typeof value
    const issues: string[] = []

    // Check for common issues
    if (exists) {
      if (value === "undefined" || value === "null") {
        issues.push(`Value is the string "${value}" instead of actual ${value}`)
      }

      if (type === "string") {
        if (value.startsWith('"') && value.endsWith('"')) {
          issues.push("Value has extra quotes around it")
        }

        if (value.trim() !== value) {
          issues.push("Value has extra whitespace")
        }
      }
    }

    return {
      exists,
      type,
      value: exists
        ? type === "string"
          ? value.length > 10
            ? `${value.substring(0, 10)}...`
            : value
          : String(value)
        : "undefined",
      issues,
    }
  }

  return {
    isServer,
    variables: {
      NEXT_PUBLIC_SUPABASE_URL: checkVariable("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
      NEXT_PUBLIC_SUPABASE_ANON_KEY: checkVariable(
        "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      ),
    },
  }
}
