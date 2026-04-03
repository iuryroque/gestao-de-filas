"use client";

import React from "react";
import { useTheme } from "../ThemeContext";

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

export function StatsOverview() {
  const { highContrast } = useTheme();

  return (
    <div className="flex gap-8 items-start">
      {/* Performance Card */}
      <div className={`p-8 rounded-[2rem] flex-1 flex flex-col transition-all ${
        highContrast 
          ? "bg-black border-2 border-white" 
          : "bg-surface-lowest shadow-ambient border border-secondary/5"
      }`}>
        <div className="flex justify-between items-center mb-8">
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
          <StatItem label="Atendimentos Concluídos" value="24" />
          <StatItem label="Tempo Médio (TMA)" value="08:12" />
          <StatItem label="SLA Excedido" value="02" color="text-error" />
        </div>
      </div>

      {/* Status Card */}
      <div className={`p-8 rounded-[2rem] w-64 flex flex-col transition-all ${
        highContrast 
          ? "bg-black border-2 border-white" 
          : "bg-surface-lowest shadow-ambient border border-secondary/5"
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
  );
}
