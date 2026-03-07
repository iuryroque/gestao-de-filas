"use client"

import React from "react"
import { useTheme } from "./ThemeContext"

export function ThemeToggle() {
  const { highContrast, toggleHighContrast } = useTheme()

  return (
    <button
      onClick={toggleHighContrast}
      className={`p-2 rounded-full transition-all flex items-center justify-center w-10 h-10 border shadow-sm cursor-pointer ${
        highContrast
          ? "bg-slate-800 border-slate-700 text-yellow-400 hover:bg-slate-700"
          : "bg-white border-gray-200 text-slate-600 hover:bg-gray-100"
      }`}
      aria-label={highContrast ? "Ativar Modo Claro" : "Ativar Modo Escuro"}
      title={highContrast ? "Ativar Modo Claro" : "Ativar Modo Escuro"}
    >
      <span className="text-xl" aria-hidden="true">
        {highContrast ? "☀️" : "🌙"}
      </span>
    </button>
  )
}
