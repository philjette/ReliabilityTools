"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

// Define the shape of our context state
interface AppContextState {
  // Add any global state properties your app needs
  selectedFMEAs: string[]
  notifications: Array<{ id: string; message: string; type: "info" | "success" | "error" | "warning" }>
}

// Define the shape of our context value
interface AppContextValue extends AppContextState {
  // Add methods to update the state
  setSelectedFMEAs: (fmeaIds: string[]) => void
  addNotification: (message: string, type: "info" | "success" | "error" | "warning") => void
  removeNotification: (id: string) => void
  clearSelectedFMEAs: () => void
}

// Create the context with a default value
const AppContext = createContext<AppContextValue | undefined>(undefined)

// Props for the AppContextProvider component
interface AppContextProviderProps {
  children: ReactNode
}

// Provider component that wraps your app and makes the context available
export function AppContextProvider({ children }: AppContextProviderProps) {
  // State for selected FMEAs
  const [selectedFMEAs, setSelectedFMEAs] = useState<string[]>([])

  // State for notifications
  const [notifications, setNotifications] = useState<AppContextState["notifications"]>([])

  // Method to add a notification
  const addNotification = (message: string, type: "info" | "success" | "error" | "warning") => {
    const id = Date.now().toString()
    setNotifications((prev) => [...prev, { id, message, type }])

    // Auto-remove notifications after 5 seconds
    setTimeout(() => {
      removeNotification(id)
    }, 5000)
  }

  // Method to remove a notification
  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id))
  }

  // Method to clear selected FMEAs
  const clearSelectedFMEAs = () => {
    setSelectedFMEAs([])
  }

  // The value that will be provided to consumers of the context
  const value: AppContextValue = {
    selectedFMEAs,
    notifications,
    setSelectedFMEAs,
    addNotification,
    removeNotification,
    clearSelectedFMEAs,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

// Custom hook to use the app context
export function useAppContext() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppContextProvider")
  }
  return context
}

// Export the context itself in case it's needed
export default AppContext
