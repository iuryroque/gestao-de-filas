"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, AlertCircle, Clock, Users } from "lucide-react";
import { useTheme } from "../ThemeContext";

interface QueueCardProps {
  queueId: string;
  queueName: string;
  waitingCount: number;
  priorityCount: number;
  activeDesks: number;
  sla: number;
  slaStatus: "ok" | "warning" | "critical";
  tme2h: number;
  tma2h: number;
  tme1h: number;
  tme4h: number;
  estimatedWaitMinutes: number;
}

export function QueueCard({ card }: { card: QueueCardProps }) {
  const [expanded, setExpanded] = useState(false);
  const { highContrast } = useTheme();

  const isCritical = card.slaStatus === "critical";
  const isWarning = card.slaStatus === "warning";

  // Color logic based on Tonal Layering
  const statusColorClass = isCritical
    ? (highContrast ? "border-error text-white" : "bg-error-container/30 text-on-error-container")
    : isWarning
    ? (highContrast ? "border-warning text-white" : "bg-warning-container/50 text-on-warning-container")
    : (highContrast ? "border-white bg-black" : "bg-surface-lowest shadow-ambient");

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      className={`rounded-[3rem] transition-all cursor-pointer p-8 ${statusColorClass} ${
        isCritical && !highContrast ? "shadow-lg shadow-error/10" : ""
      } hover:shadow-xl active:scale-[0.99]`}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className={`text-xl font-display font-black tracking-tight ${
            highContrast ? "text-white" : "text-primary"
          }`}>
            {card.queueName}
          </h3>
          <p className={`text-[10px] uppercase font-bold tracking-[0.2em] mt-1 ${
             isCritical ? "text-on-error-container/60" : (highContrast ? "text-white/50" : "text-secondary/50")
          }`}>
             {card.slaStatus === "critical" ? "🔴 SLA Crítico" 
               : card.slaStatus === "warning" ? "🟡 Em Alerta" 
               : "🟢 Estável"}
          </p>
        </div>
        
        {card.activeDesks === 0 && card.waitingCount > 0 && (
          <div className="bg-error text-white text-[10px] font-black px-3 py-1 rounded-full animate-bounce">
            NENHUM GUICHÊ ATIVO
          </div>
        )}
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="flex flex-col">
            <span className="text-3xl font-display font-black">{card.waitingCount}</span>
            <span className={`text-[10px] uppercase font-bold tracking-widest ${
                highContrast ? "text-white/40" : "text-secondary/40"
            }`}>Aguardando</span>
        </div>
        <div className="flex flex-col">
            <span className="text-3xl font-display font-black">{card.tme2h.toFixed(0)}<span className="text-sm font-bold ml-1">min</span></span>
            <span className={`text-[10px] uppercase font-bold tracking-widest ${
                highContrast ? "text-white/40" : "text-secondary/40"
            }`}>TME (2h)</span>
        </div>
        <div className="flex flex-col">
            <span className="text-3xl font-display font-black">{card.activeDesks}</span>
            <span className={`text-[10px] uppercase font-bold tracking-widest ${
                highContrast ? "text-white/40" : "text-secondary/40"
            }`}>Guichês</span>
        </div>
      </div>

      {/* SLA Progress Bar (Empathy Rule: Soft Tones) */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between items-center text-[10px] font-bold tracking-[0.05em]">
           <span className={highContrast ? "text-white/40" : "text-secondary/40"}>SLA LIMITE: {card.sla}min</span>
           <span className={isCritical ? "text-error font-black" : (highContrast ? "text-white/40" : "text-secondary/40")}>
             {((card.tme2h / card.sla) * 100).toFixed(0)}% USADO
           </span>
        </div>
        <div className={`h-2.5 w-full rounded-full overflow-hidden ${
            highContrast ? "bg-white/10" : "bg-surface-low"
        }`}>
            <div 
                className={`h-full transition-all duration-1000 ${
                    isCritical ? "bg-error" : isWarning ? "bg-warning" : "bg-success"
                }`}
                style={{ width: `${Math.min((card.tme2h / card.sla) * 100, 100)}%` }}
            />
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex justify-between items-center mt-6 pt-4">
        <span className={`text-[10px] font-body ${highContrast ? "text-white/30" : "text-secondary/40"}`}>
            {card.priorityCount > 0 ? `🟡 ${card.priorityCount} prioritários` : "Fila normal"}
        </span>
        <button className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-primary">
            <span>{expanded ? "Recolher" : "Detalhes"}</span>
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Expanded Data Display (Authority Rule: Density Management) */}
      {expanded && (
        <div className="mt-8 space-y-6 animate-in slide-in-from-top-4 duration-300">
           <div className={`p-4 rounded-2xl ${highContrast ? "bg-white/5" : "bg-surface-low/30"}`}>
              <h4 className={`text-[10px] uppercase font-black tracking-widest mb-4 ${
                  highContrast ? "text-white/40" : "text-secondary/40"
              }`}>Tendência TME</h4>
              <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="flex flex-col">
                      <span className="text-lg font-bold">{card.tme1h.toFixed(1)}</span>
                      <span className="text-[9px] uppercase tracking-tighter opacity-50">1h</span>
                  </div>
                  <div className="flex flex-col opacity-100">
                      <span className="text-lg font-bold">{card.tme2h.toFixed(1)}</span>
                      <span className="text-[9px] uppercase tracking-tighter opacity-50">2h</span>
                  </div>
                  <div className="flex flex-col opacity-50">
                      <span className="text-lg font-bold">{card.tme4h.toFixed(1)}</span>
                      <span className="text-[9px] uppercase tracking-tighter opacity-50">4h</span>
                  </div>
              </div>
           </div>

           <div className={`p-4 rounded-2xl ${highContrast ? "bg-white/5" : "bg-surface-low/30"}`}>
              <h4 className={`text-[10px] uppercase font-black tracking-widest mb-2 ${
                  highContrast ? "text-white/40" : "text-secondary/40"
              }`}>TMA Médio</h4>
              <div className="flex items-end gap-2">
                 <span className="text-2xl font-black">{card.tma2h.toFixed(1)}<span className="text-xs font-bold ml-1">min</span></span>
                 <span className="text-[9px] mb-1.5 uppercase font-bold opacity-40">Eficiência Operacional</span>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
