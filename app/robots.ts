import type { MetadataRoute } from "next"

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://reliabilitytools.ai"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/dashboard/", "/curves/", "/auth/", "/direct-dashboard"] },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
