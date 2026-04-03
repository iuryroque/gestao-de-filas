"use client";

import React, { useState } from "react";
import { useTheme } from "../ThemeContext";
import { ChevronUp, ChevronDown, BarChart2 } from "lucide-react";

interface StatItemProps {
  label: string;
  value: string | number;
  sublabel?: string;
  color?: string;
}

function StatItem({ label, value, sublabel, color }: StatItemProps) {
  const { highContrast } = useTheme();
  
  return (
    <div className="flex flex-col gap-2">
      <h3 className={`text-[10px] uppercase font-black tracking-widest ${
        highContrast ? "text-white/50" : "text-secondary/60"
      }`}>
        {label}
      </h3>
      <div className="flex flex-col">
        <span className={`text-4xl font-display font-black ${
          color ? color : (highContrast ? "text-white" : "text-primary")
        }`}>
          {value}
        </span>
        {sublabel && (
          <span className={`text-[10px] font-body mt-1 ${
            highContrast ? "text-white/30" : "text-secondary/40"
          }`}>
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}

export function StatsOverview({
    completed = 0,
    tma = "--",
    slaBreaches = 0
}: {
    completed?: number | string;
    tma?: string;
    slaBreaches?: number | string;
}) {
  const { highContrast } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="flex flex-col gap-4 mt-auto">
      {/* Accordion Toggle */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between p-4 rounded-3xl transition-all ${
          highContrast 
            ? "bg-black border-2 border-white hover:bg-white/10" 
            : "bg-surface-lowest shadow-sm hover:shadow-md border border-primary/5"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${highContrast ? "bg-white text-black" : "bg-primary/5 text-primary"}`}>
            <BarChart2 className="w-5 h-5" />
          </div>
          <span className={`font-display font-black ${highContrast ? "text-white" : "text-primary"}`}>
            Performance e Status
          </span>
        </div>
        {isExpanded ? (
           <ChevronDown className={highContrast ? "text-white" : "text-secondary"} />
        ) : (
           <ChevronUp className={highContrast ? "text-white" : "text-secondary"} />
        )}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="flex gap-8 items-start animate-in slide-in-from-bottom-4 fade-in duration-300">
          {/* Performance Card */}
          <div className={`p-8 rounded-[3rem] flex-1 flex flex-col transition-all ${
            highContrast 
              ? "bg-black border-2 border-white" 
              : "bg-surface-lowest shadow-ambient shadow-primary/5"
          }`}>
            <div className="flex justify-between items-center mb-6">
          <h2 className={`font-display font-black text-lg ${highContrast ? "text-white" : "text-primary"}`}>
            Sua Performance Hoje
          </h2>
          <span className={`text-[10px] uppercase font-bold tracking-widest ${
            highContrast ? "text-white/30" : "text-secondary/30"
          }`}>
            Atualizado agora
          </span>
        </div>
        
        <div className="flex gap-12">
          <StatItem label="Atendimentos Concluídos" value={completed} />
          <StatItem label="Tempo Médio (TMA)" value={tma} />
          <StatItem label="SLA Excedido" value={slaBreaches} color="text-error" />
        </div>
      </div>

      {/* Status Card */}
      <div className={`p-10 rounded-[3rem] w-72 flex flex-col transition-all ${
        highContrast 
          ? "bg-black border-2 border-white" 
          : "bg-surface-lowest shadow-ambient shadow-primary/5"
      }`}>
        <h2 className={`font-display font-black text-lg mb-6 ${highContrast ? "text-white" : "text-primary"}`}>
          Status Atual
        </h2>
        
        <div className="space-y-2">
            {[
                { name: "Disponível", icon: "🟢", active: true },
                { name: "Pausa Café", icon: "🟠", active: false },
                { name: "Administrativo", icon: "⚪", active: false }
            ].map(status => (
                <button 
                  key={status.name}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                    status.active
                        ? (highContrast ? "bg-white text-black" : "bg-success-container/30 text-on-success-container border border-success-container")
                        : (highContrast ? "text-white/50 border border-white/10" : "text-secondary/60 border border-transparent hover:bg-surface-low")
                  }`}
                >
                    <span className="w-2 h-2 rounded-full bg-current" />
                    <span>{status.name}</span>
                </button>
            ))}
        </div>
        </div>
      </div>
      )}
    </div>
  );
}
