"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const screenshots = [
  {
    src: "/images/dashboard-screenshot.png",
    alt: "Dashboard showing saved FMEAs and analysis tools",
    title: "Dashboard Overview",
  },
  {
    src: "/images/fmea-builder-screenshot.png",
    alt: "AI-powered FMEA generation interface",
    title: "FMEA Builder",
  },
  {
    src: "/images/data-analysis-screenshot.png",
    alt: "Weibull analysis and reliability curves",
    title: "Data Analysis",
  },
]

export function ScreenshotCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % screenshots.length)
  }, [])

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + screenshots.length) % screenshots.length)
  }, [])

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
    setIsAutoPlaying(false)
  }

  useEffect(() => {
    if (!isAutoPlaying) return

    const interval = setInterval(() => {
      nextSlide()
    }, 5000)

    return () => clearInterval(interval)
  }, [isAutoPlaying, nextSlide])

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Main carousel container */}
      <div 
        className="relative overflow-hidden rounded-xl shadow-2xl bg-gray-900"
        onMouseEnter={() => setIsAutoPlaying(false)}
        onMouseLeave={() => setIsAutoPlaying(true)}
      >
        {/* Screenshots */}
        <div 
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {screenshots.map((screenshot, index) => (
            <div key={index} className="w-full flex-shrink-0">
              <div className="relative aspect-[16/10]">
                <Image
                  src={screenshot.src}
                  alt={screenshot.alt}
                  fill
                  className="object-cover object-top"
                  priority={index === 0}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Navigation arrows */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full shadow-md h-8 w-8"
          onClick={prevSlide}
          aria-label="Previous screenshot"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full shadow-md h-8 w-8"
          onClick={nextSlide}
          aria-label="Next screenshot"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Caption overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
          <p className="text-white text-sm font-medium text-center">
            {screenshots[currentIndex].title}
          </p>
        </div>
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-1.5 mt-3">
        {screenshots.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-300",
              currentIndex === index 
                ? "bg-blue-600 w-6" 
                : "bg-gray-300 hover:bg-gray-400"
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
