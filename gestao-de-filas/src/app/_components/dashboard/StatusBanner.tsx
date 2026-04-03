"use client";

import React from "react";
import { AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useTheme } from "../ThemeContext";

interface StatusBannerProps {
  criticalCount: number;
  warningCount: number;
  totalQueues: number;
}

export function StatusBanner({ criticalCount, warningCount, totalQueues }: StatusBannerProps) {
  const { highContrast } = useTheme();

  if (totalQueues === 0) return null;

  const isAllOk = criticalCount === 0 && warningCount === 0;

  return (
    <div className="flex gap-4 flex-wrap mb-10">
      {criticalCount > 0 && (
        <div className={`flex items-center gap-4 px-8 py-6 rounded-[2.5rem] transition-all animate-pulse shadow-lg ${
          highContrast 
            ? "bg-black border border-error text-white" 
            : "bg-error-container/40 text-on-error-container"
        }`}>
          <AlertCircle className="w-6 h-6" />
          <div>
            <p className="text-sm font-display font-black uppercase tracking-widest">Estado Crítico</p>
            <p className="text-lg font-body font-bold">
              {criticalCount} fila{criticalCount > 1 ? "s" : ""} requer{criticalCount > 1 ? "em" : "e"} atenção imediata
            </p>
          </div>
        </div>
      )}

      {warningCount > 0 && (
        <div className={`flex items-center gap-4 px-8 py-6 rounded-[2.5rem] transition-all ${
          highContrast 
            ? "bg-black border border-warning text-white" 
            : "bg-warning-container/60 text-on-warning-container shadow-sm"
        }`}>
          <AlertTriangle className="w-6 h-6" />
          <div>
            <p className="text-sm font-display font-black uppercase tracking-widest">Em Alerta</p>
            <p className="text-lg font-body font-bold">
              {warningCount} fila{warningCount > 1 ? "s" : ""} com TME elevado
            </p>
          </div>
        </div>
      )}

      {isAllOk && (
        <div className={`flex items-center gap-4 px-8 py-4 rounded-full transition-all ${
          highContrast 
            ? "bg-black border border-success text-white" 
            : "bg-success-container/40 text-on-success-container shadow-sm"
        }`}>
          <CheckCircle2 className="w-6 h-6" />
          <div>
            <p className="text-sm font-display font-black uppercase tracking-widest">Operação Estável</p>
            <p className="text-lg font-body font-bold">Todas as filas dentro do SLA operacional</p>
          </div>
        </div>
      )}
    </div>
  );
}
