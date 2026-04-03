"use client";

import React from "react";
import { User, PhoneOff, ArrowRightLeft, CheckCircle2, Volume2 } from "lucide-react";
import { useTheme } from "../ThemeContext";

interface CallingCardProps {
  ticketCode: string | null;
  service?: string;
  attendantName?: string;
  onCallNext: () => void;
  onRecall: () => void;
  onTransfer: () => void;
  onFinish: () => void;
  isPending?: boolean;
}

export function CallingCard({ 
  ticketCode, 
  service, 
  attendantName,
  onCallNext,
  onRecall,
  onTransfer,
  onFinish,
  isPending 
}: CallingCardProps) {
  const { highContrast } = useTheme();

  if (!ticketCode) {
    return (
      <div className={`w-full max-w-2xl p-10 rounded-[2.5rem] flex flex-col items-center justify-center text-center transition-all ${
        highContrast 
          ? "bg-black border-4 border-white" 
          : "bg-surface-lowest shadow-ambient border border-secondary/5"
      }`}>
        <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mb-8">
           <Volume2 className="w-10 h-10 text-primary opacity-20" />
        </div>
        <h2 className="text-3xl font-display font-black text-primary mb-4">Nenhuma senha em atendimento</h2>
        <p className="text-secondary font-body mb-10 max-w-xs">
          O sistema está pronto. Clique no botão abaixo para chamar o primeiro da fila.
        </p>
        <button
          onClick={onCallNext}
          disabled={isPending}
          className={`px-12 py-5 rounded-2xl font-body font-black text-xl shadow-2xl hover:scale-105 active:scale-95 transition-all ${
            highContrast ? "bg-white text-black" : "bg-gradient-to-br from-primary to-primary-container text-on-primary"
          }`}
        >
          {isPending ? "Chamando..." : "Chamar Próximo"}
        </button>
      </div>
    );
  }

  return (
    <div className={`w-full max-w-2xl rounded-[2.5rem] relative overflow-hidden transition-all ${
      highContrast 
        ? "bg-black border-4 border-white p-10" 
        : "bg-surface-lowest shadow-ambient p-1" // Wrapper for gradient border if wanted, but using mockup style
    }`}>
      {/* Background Gradient & Pattern (Mockup Style) */}
      {!highContrast && (
        <div className="absolute inset-0 bg-gradient-to-br from-[#00346f] to-[#004a99] z-0" />
      )}
      
      <div className={`relative z-10 p-10 h-full flex flex-col justify-between ${
        highContrast ? "" : "text-on-primary"
      }`}>
        <div className="flex justify-between items-start mb-8">
          <div className="space-y-4">
            <span className={`text-[10px] uppercase font-black tracking-[0.3em] ${
              highContrast ? "text-white/50" : "text-white/60"
            }`}>
              Em Antendimento
            </span>
            <h1 className="text-8xl font-display font-black tracking-tighter">
              {ticketCode}
            </h1>
            <div className="mt-6 space-y-1">
               <h3 className="text-2xl font-body font-bold text-white">
                 {attendantName || "Carlos Eduardo Ferreira"}
               </h3>
               <p className={`text-sm ${highContrast ? "text-white/50" : "text-white/60"}`}>
                 Serviço: {service || "Emissão de Documentos"}
               </p>
            </div>
          </div>

          {/* Action Buttons Column */}
          <div className="flex flex-col gap-4">
            <button 
              onClick={onCallNext}
              className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-body font-black text-primary transition-all hover:scale-[1.02] active:scale-[0.98] ${
                highContrast ? "bg-white text-black" : "bg-white/95 backdrop-blur-lg shadow-xl"
              }`}
            >
              <Volume2 className="w-5 h-5" />
              <span>Chamar Próximo</span>
            </button>
            
            <div className="flex gap-4">
              <button 
                onClick={onRecall}
                className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-body font-bold transition-all hover:bg-white/10 ${
                  highContrast ? "border-2 border-white" : "bg-white/10 backdrop-blur-md border border-white/10"
                }`}
              >
                <PhoneOff className="w-4 h-4" />
                <span>Rechamar</span>
              </button>
              <button 
                onClick={onTransfer}
                className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-body font-bold transition-all hover:bg-white/10 ${
                  highContrast ? "border-2 border-white" : "bg-white/10 backdrop-blur-md border border-white/10"
                }`}
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span>Transferir</span>
              </button>
            </div>

            <button 
              onClick={onFinish}
              className={`flex items-center justify-center gap-3 py-4 rounded-2xl font-body font-black transition-all hover:scale-[1.02] active:scale-[0.98] ${
                highContrast 
                  ? "bg-success text-white border-2 border-white" 
                  : "bg-[#fee2e2] text-on-error-container" // Mockup uses a soft red for finish button
              }`}
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Encerrar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
