"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  Clock, 
  Briefcase, 
  BarChart3, 
  FileText, 
  HelpCircle, 
  LogOut 
} from "lucide-react";
import { useTheme } from "../ThemeContext";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Fila em Tempo Real", href: "/guiche", icon: Users },
  { name: "Atendentes", href: "/atendentes", icon: Clock },
  { name: "Serviços", href: "/servicos", icon: Briefcase },
  { name: "SLA", href: "/sla", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const { highContrast } = useTheme();

  return (
    <aside className={`w-64 min-h-screen flex flex-col py-8 px-4 transition-all duration-500 sticky top-0 ${
      highContrast 
        ? "bg-black border-r border-white" 
        : "bg-[#001a35] text-white"
    }`}>
      {/* Logo */}
      <div className="px-4 mb-10">
        <h1 className={`text-xl font-display font-black flex items-center gap-2 ${
          highContrast ? "text-white" : "text-white"
        }`}>
          <span className="text-2xl">🏛️</span>
          <span>SIGA</span>
        </h1>
        <p className={`text-[10px] uppercase tracking-widest font-bold mt-1 ${
          highContrast ? "text-white/50" : "text-slate-400"
        }`}>
          Gestão de Filas
        </p>
      </div>

      <p className={`px-4 text-[11px] uppercase tracking-[0.2em] font-black mb-6 ${
        highContrast ? "text-white/40" : "text-slate-500"
      }`}>
        Administração
      </p>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-body font-medium transition-all group ${
                isActive
                  ? (highContrast ? "bg-white text-black" : "bg-white/10 text-white shadow-xl")
                  : (highContrast ? "text-white hover:bg-white/10" : "text-slate-400 hover:text-white hover:bg-white/5")
              }`}
            >
              <Icon className={`w-5 h-5 transition-colors ${
                isActive ? (highContrast ? "text-black" : "text-white") : "text-slate-500 group-hover:text-white"
              }`} />
              <span className="text-sm">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Actions */}
      <div className="mt-auto space-y-4 pt-8 border-t border-secondary/10">
        <button className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl bg-primary text-on-primary font-body font-bold text-sm shadow-lg hover:brightness-110 transition-all">
          <FileText className="w-5 h-5" />
          <span>Emitir Relatório</span>
        </button>

        <div className="space-y-1">
          <button className={`w-full flex items-center gap-3 px-4 py-3 transition-all text-sm font-medium ${
            highContrast ? "text-white/70 hover:text-white" : "text-slate-400 hover:text-white"
          }`}>
            <HelpCircle className="w-5 h-5" />
            <span>Suporte</span>
          </button>
          <Link href="/" className={`w-full flex items-center gap-3 px-4 py-3 transition-all text-sm font-medium ${
            highContrast ? "text-error hover:brightness-125" : "text-slate-400 hover:text-error"
          }`}>
            <LogOut className="w-5 h-5" />
            <span>Sair</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
