"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

type ThemeContextType = {
  highContrast: boolean
  setHighContrast: (value: boolean) => void
  toggleHighContrast: () => void
  sidebarCollapsed: boolean
  setSidebarCollapsed: (value: boolean) => void
  toggleSidebar: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [highContrast, setHighContrast] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("highContrast")
    const savedSidebar = localStorage.getItem("sidebarCollapsed")
    if (savedTheme === "true") setHighContrast(true)
    if (savedSidebar === "true") setSidebarCollapsed(true)
    setMounted(true)
  }, [])

  // Update body class and localStorage when theme changes
  useEffect(() => {
    if (!mounted) return
    localStorage.setItem("highContrast", String(highContrast))
    localStorage.setItem("sidebarCollapsed", String(sidebarCollapsed))
    
    if (highContrast) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [highContrast, sidebarCollapsed, mounted])

  const toggleHighContrast = () => setHighContrast(!highContrast)
  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed)

  return (
    <ThemeContext.Provider value={{ 
      highContrast, 
      setHighContrast, 
      toggleHighContrast,
      sidebarCollapsed,
      setSidebarCollapsed,
      toggleSidebar
    }}>
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
