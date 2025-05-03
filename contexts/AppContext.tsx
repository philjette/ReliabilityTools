"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

type FMEA = {
  id: string
  title: string
  asset_type: string
  [key: string]: any
}

interface AppContextType {
  selectedFMEAs: FMEA[]
  addSelectedFMEA: (fmea: FMEA) => void
  removeSelectedFMEA: (id: string) => void
  clearSelectedFMEAs: () => void
  isSelected: (id: string) => boolean
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppContextProvider({ children }: { children: ReactNode }) {
  const [selectedFMEAs, setSelectedFMEAs] = useState<FMEA[]>([])

  const addSelectedFMEA = (fmea: FMEA) => {
    // Limit to max 3 FMEAs for comparison
    if (selectedFMEAs.length < 3 && !selectedFMEAs.some((f) => f.id === fmea.id)) {
      setSelectedFMEAs([...selectedFMEAs, fmea])
    }
  }

  const removeSelectedFMEA = (id: string) => {
    setSelectedFMEAs(selectedFMEAs.filter((fmea) => fmea.id !== id))
  }

  const clearSelectedFMEAs = () => {
    setSelectedFMEAs([])
  }

  const isSelected = (id: string) => {
    return selectedFMEAs.some((fmea) => fmea.id === id)
  }

  return (
    <AppContext.Provider
      value={{
        selectedFMEAs,
        addSelectedFMEA,
        removeSelectedFMEA,
        clearSelectedFMEAs,
        isSelected,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppContextProvider")
  }
  return context
}
