"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

type ThemeContextType = {
  highContrast: boolean
  setHighContrast: (value: boolean) => void
  toggleHighContrast: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [highContrast, setHighContrast] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Load theme from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("highContrast")
    if (saved === "true") {
      setHighContrast(true)
    }
    setMounted(true)
  }, [])

  // Update body class and localStorage when theme changes
  useEffect(() => {
    if (!mounted) return
    localStorage.setItem("highContrast", String(highContrast))
    
    // We can also apply a global class to the body if we want to use traditional CSS
    if (highContrast) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [highContrast, mounted])

  const toggleHighContrast = () => setHighContrast(!highContrast)

  return (
    <ThemeContext.Provider value={{ highContrast, setHighContrast, toggleHighContrast }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
