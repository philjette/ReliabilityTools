"use client"

import Image from "next/image"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

const screenshots = [
  {
    src: "/images/dashboard-screenshot.png",
    alt: "Dashboard view showing asset management and analytics",
    title: "Dashboard Overview",
  },
  {
    src: "/images/fmea-builder-screenshot.png",
    alt: "FMEA Builder interface for creating failure mode analysis",
    title: "FMEA Builder",
  },
  {
    src: "/images/data-analysis-screenshot.png",
    alt: "Weibull analysis and reliability metrics visualization",
    title: "Data Analysis",
  },
]

export function ScreenshotCarousel() {
  return (
    <div className="w-full max-w-3xl mx-auto px-12">
      <Carousel
        opts={{
          align: "center",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent>
          {screenshots.map((screenshot, index) => (
            <CarouselItem key={index}>
              <div className="p-1">
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                  <Image
                    src={screenshot.src}
                    alt={screenshot.alt}
                    width={672}
                    height={378}
                    className="w-full h-auto object-cover"
                    priority={index === 0}
                  />
                </div>
                <p className="text-center text-sm text-gray-600 mt-3 font-medium">
                  {screenshot.title}
                </p>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="bg-white hover:bg-gray-100 border-gray-300" />
        <CarouselNext className="bg-white hover:bg-gray-100 border-gray-300" />
      </Carousel>
    </div>
  )
}
