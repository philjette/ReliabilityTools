"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

// Define the shape of our context state
interface AppContextState {
  selectedFMEAs: string[]
  addFMEA: (id: string) => void
  removeFMEA: (id: string) => void
  clearSelectedFMEAs: () => void
  isSelected: (id: string) => boolean
}

// Create the context with a default value
const AppContext = createContext<AppContextState | undefined>(undefined)

// Provider component that wraps parts of our app that need the context
export function AppProvider({ children }: { children: ReactNode }) {
  const [selectedFMEAs, setSelectedFMEAs] = useState<string[]>([])

  const addFMEA = (id: string) => {
    if (!selectedFMEAs.includes(id)) {
      setSelectedFMEAs([...selectedFMEAs, id])
    }
  }

  const removeFMEA = (id: string) => {
    setSelectedFMEAs(selectedFMEAs.filter((fmeaId) => fmeaId !== id))
  }

  const clearSelectedFMEAs = () => {
    setSelectedFMEAs([])
  }

  const isSelected = (id: string) => {
    return selectedFMEAs.includes(id)
  }

  // The value that will be provided to consumers of this context
  const value = {
    selectedFMEAs,
    addFMEA,
    removeFMEA,
    clearSelectedFMEAs,
    isSelected,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

// Custom hook to use the app context
export function useAppContext() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider")
  }
  return context
}
