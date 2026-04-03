"use client";

import React from "react";
import { useTheme } from "../ThemeContext";
import { ChevronRight } from "lucide-react";

interface Ticket {
  id: string;
  code: string;
  service: string;
  time: string;
  wait: string;
  isCritical?: boolean;
}

const mockTickets: Ticket[] = [
  { id: "1", code: "A-403", service: "Prioridade Legal", time: "14:20", wait: "12min" },
  { id: "2", code: "B-112", service: "SLA CRÍTICO", time: "14:05", wait: "27min", isCritical: true },
  { id: "3", code: "A-404", service: "Convencional", time: "14:28", wait: "4min" },
  { id: "4", code: "A-405", service: "Convencional", time: "14:30", wait: "2min" },
];

export function NextTicketsList({ tickets = mockTickets }: { tickets?: Ticket[] }) {
  const { highContrast } = useTheme();

  return (
    <div className={`w-80 h-full flex flex-col p-8 transition-all ${
      highContrast 
        ? "bg-black border-l border-white" 
        : "bg-surface-low/50"
    }`}>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className={`text-2xl font-display font-black ${
            highContrast ? "text-white" : "text-primary"
          }`}>
            Próximos
          </h2>
          <p className={`text-xs font-body ${
            highContrast ? "text-white/50" : "text-secondary/60"
          }`}>
            Sua fila específica
          </p>
        </div>
        <span className={`px-4 py-1 rounded-full text-[10px] font-black tracking-widest ${
          highContrast ? "bg-white text-black" : "bg-primary text-on-primary"
        }`}>
          {tickets.length} TICKETS
        </span>
      </div>

      <div className="flex flex-col gap-4 overflow-y-auto pr-2">
        {tickets.map((ticket) => (
          <div 
            key={ticket.id}
            className={`p-6 rounded-[1.5rem] flex items-center justify-between transition-all ${
              ticket.isCritical
                ? (highContrast ? "bg-error border-2 border-white" : "bg-error-container/50 border border-error-container")
                : (highContrast ? "bg-black border-2 border-white" : "bg-surface-lowest shadow-ambient border border-secondary/5")
            }`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-display font-black text-xl mr-4 ${
              ticket.isCritical
                ? "bg-error text-white"
                : (highContrast ? "bg-white text-black" : "bg-primary/5 text-primary")
            }`}>
              {ticket.code.charAt(0)}
            </div>
            
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex justify-between items-center">
                    <span className={`font-display font-black ${
                        ticket.isCritical ? "text-on-error-container" : (highContrast ? "text-white" : "text-primary")
                    }`}>
                        {ticket.code}
                    </span>
                    <span className={`text-[10px] font-bold ${
                        ticket.isCritical ? "text-on-error-container/60" : (highContrast ? "text-white/50" : "text-secondary/60")
                    }`}>
                        {ticket.time}
                    </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                    <span className={`text-[10px] uppercase font-bold truncate ${
                        ticket.isCritical ? "text-error" : (highContrast ? "text-white/40" : "text-secondary/40")
                    }`}>
                        {ticket.service}
                    </span>
                    <span className={`text-[10px] font-medium ${
                        ticket.isCritical ? "text-error font-black" : (highContrast ? "text-white/40" : "text-secondary/40")
                    }`}>
                        Espera: {ticket.wait}
                    </span>
                </div>
            </div>
          </div>
        ))}
      </div>

      <button className={`mt-auto flex items-center justify-center gap-2 py-4 text-sm font-black transition-all ${
        highContrast ? "text-white hover:underline" : "text-primary hover:gap-3"
      }`}>
        <span>Ver fila completa</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
