"use client";

import React from "react";
import Link from "next/link";
import { 
  Ticket, 
  UserSquare2, 
  Monitor, 
  BarChart3, 
  FileText, 
  Settings2,
  ChevronRight
} from "lucide-react";
import { useTheme } from "./_components/ThemeContext";
import { ThemeToggle } from "./_components/ThemeToggle";

interface PortalCardProps {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

function PortalCard({ href, title, description, icon }: PortalCardProps) {
  const { highContrast } = useTheme();
  
  return (
    <Link
      href={href}
      className={`group flex flex-col p-8 rounded-[2rem] border transition-all hover:scale-[1.02] active:scale-[0.98] ${
        highContrast 
          ? "bg-black border-2 border-white text-white hover:bg-white/10" 
          : "bg-surface-lowest shadow-ambient border-secondary/5 hover:shadow-xl"
      }`}
    >
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-colors ${
        highContrast ? "bg-white text-black" : "bg-primary/5 text-primary group-hover:bg-primary group-hover:text-on-primary"
      }`}>
        {icon}
      </div>
      <h3 className={`text-2xl font-display font-black tracking-tight mb-3 ${
        highContrast ? "text-white" : "text-primary"
      }`}>
        {title}
      </h3>
      <p className={`text-sm font-body leading-relaxed mb-8 ${
        highContrast ? "text-white/50" : "text-secondary/60"
      }`}>
        {description}
      </p>
      <div className={`mt-auto flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
        highContrast ? "text-white" : "text-primary opacity-40 group-hover:opacity-100 group-hover:gap-3"
      }`}>
        <span>Acessar Portal</span>
        <ChevronRight className="w-3 h-3" />
      </div>
    </Link>
  );
}

export default function Home() {
  const { highContrast } = useTheme();

  return (
    <main className={`flex min-h-screen flex-col transition-colors relative overflow-hidden ${
      highContrast ? "bg-black" : "bg-surface"
    }`}>
      {/* Decorative Background Element */}
      {!highContrast && (
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      )}

      <nav className="w-full px-12 py-8 flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white text-xl">
             🏛️
          </div>
          <div>
            <h2 className={`text-sm font-display font-black tracking-widest uppercase ${
              highContrast ? "text-white" : "text-primary"
            }`}>
              SIGA
            </h2>
            <p className={`text-[9px] font-body font-bold opacity-40 uppercase tracking-tighter`}>
              Gestão de Atendimento
            </p>
          </div>
        </div>
        <ThemeToggle />
      </nav>

      <div className="container mx-auto px-12 py-12 flex-1 flex flex-col justify-center z-10">
        <div className="max-w-3xl mb-16">
          <h1 className={`text-6xl md:text-8xl font-display font-black tracking-tighter leading-[0.9] mb-8 ${
            highContrast ? "text-white" : "text-primary"
          }`}>
            Autoridade <br />
            <span className={highContrast ? "text-white" : "text-primary/40"}>no Atendimento.</span>
          </h1>
          <p className={`text-xl font-body max-w-xl ${
            highContrast ? "text-white/60" : "text-secondary/70 italic"
          }`}>
            Plataforma integrada para excelência em serviços públicos e gestão de fluxos de cidadãos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full pb-12">
          <PortalCard 
            href="/totem"
            title="Totem"
            description="Interface de autoatendimento para emissão de senhas e triagem inicial."
            icon={<Ticket className="w-7 h-7" />}
          />
          <PortalCard 
            href="/guiche"
            title="Guichê"
            description="Terminal operacional para atendentes. Gestão de chamadas e transferências."
            icon={<UserSquare2 className="w-7 h-7" />}
          />
          <PortalCard 
            href="/painel"
            title="Painel"
            description="Exibição pública de chamadas em tempo real com notificações sonoras."
            icon={<Monitor className="w-7 h-7" />}
          />
          <PortalCard 
            href="/dashboard"
            title="Dashboard"
            description="Monitoramento analítico de SLAs, gargalos e performance de guichês."
            icon={<BarChart3 className="w-7 h-7" />}
          />
          <PortalCard 
            href="/relatorios"
            title="Relatórios"
            description="Base de dados histórica para auditoria e otimização operacional."
            icon={<FileText className="w-7 h-7" />}
          />
          <PortalCard 
            href="/recursos"
            title="Recursos"
            description="Configurações globais de filas, serviços e escalonamento de pessoal."
            icon={<Settings2 className="w-7 h-7" />}
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full px-12 py-8 flex justify-between items-center text-[10px] font-black uppercase tracking-widest opacity-30">
        <span>Sistema Integrado de Gestão de Atendimento</span>
        <span>Versão 2.4.0 — 2026</span>
      </footer>
    </main>
  );
}
