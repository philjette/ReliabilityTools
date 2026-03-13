import type { MetadataRoute } from "next"

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://reliabilitytools.ai"

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/analyze`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/generate`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
  ]
}
