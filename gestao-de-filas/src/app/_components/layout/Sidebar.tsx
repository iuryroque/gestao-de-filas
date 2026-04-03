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
  LogOut,
  Shield,
  Lock
} from "lucide-react";
import { useTheme } from "../ThemeContext";
import { signOut } from "next-auth/react";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Fila em Tempo Real", href: "/guiche", icon: Users },
  { name: "Atendentes", href: "/atendentes", icon: Clock },
  { name: "Serviços", href: "/servicos", icon: Briefcase },
  { name: "SLA", href: "/sla", icon: BarChart3 },
];

const adminItems = [
  { name: "Usuários", href: "/admin/usuarios", icon: Users },
  { name: "Grupos de Acesso", href: "/admin/grupos", icon: Shield },
];

export function Sidebar() {
  const pathname = usePathname();
  const { highContrast, sidebarCollapsed, toggleSidebar } = useTheme();

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <aside className={`min-h-screen flex flex-col py-8 px-4 transition-all duration-500 sticky top-0 ${
      sidebarCollapsed ? "w-20" : "w-64"
    } ${
      highContrast 
        ? "bg-black border-r border-white" 
        : "bg-[#001a35] text-white shadow-ambient"
    }`}>


      {/* Logo */}
      <div className={`px-2 mb-10 transition-all duration-300 ${sidebarCollapsed ? "items-center" : ""}`}>
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="text-2xl shrink-0">🏛️</span>
          {!sidebarCollapsed && (
            <div className="animate-in fade-in slide-in-from-left-2 duration-300">
               <h1 className="text-xl font-display font-black text-white">SIGA</h1>
            </div>
          )}
        </div>
        {!sidebarCollapsed && (
          <p className={`text-[10px] uppercase tracking-widest font-bold mt-1 animate-in fade-in duration-500 ${
            highContrast ? "text-white/50" : "text-slate-400"
          }`}>
            Gestão de Filas
          </p>
        )}
      </div>

      {!sidebarCollapsed && (
        <p className={`px-4 text-[11px] uppercase tracking-[0.2em] font-black mb-6 animate-in fade-in duration-300 ${
          highContrast ? "text-white/40" : "text-slate-500"
        }`}>
          Administração
        </p>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-8 overflow-y-auto pr-2">
        {/* Main Routes */}
        <div className="space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                title={sidebarCollapsed ? item.name : ""}
                className={`flex items-center rounded-xl font-body font-medium transition-all group relative ${
                  sidebarCollapsed ? "justify-center p-3" : "gap-3 px-4 py-3"
                } ${
                  isActive
                    ? (highContrast ? "bg-white text-black" : "bg-white/10 text-white")
                    : (highContrast ? "text-white hover:bg-white/10" : "text-slate-400 hover:text-white hover:bg-white/5")
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 transition-colors ${
                  isActive ? (highContrast ? "text-black" : "text-white") : "text-slate-500 group-hover:text-white"
                }`} />
                {!sidebarCollapsed && (
                  <span className="text-sm truncate animate-in fade-in slide-in-from-left-2 duration-300">
                    {item.name}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
        
        {/* Admin Routes */}
        <div>
          {!sidebarCollapsed && (
            <p className={`px-4 text-[10px] uppercase tracking-[0.2em] font-black mb-3 animate-in fade-in duration-300 ${
              highContrast ? "text-white/40" : "text-slate-500"
            }`}>
              Sistema
            </p>
          )}
          <div className="space-y-2">
            {adminItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  title={sidebarCollapsed ? item.name : ""}
                  className={`flex items-center rounded-xl font-body font-medium transition-all group relative ${
                    sidebarCollapsed ? "justify-center p-3" : "gap-3 px-4 py-3"
                  } ${
                    isActive
                      ? (highContrast ? "bg-white text-black" : "bg-white/10 text-white")
                      : (highContrast ? "text-white hover:bg-white/10" : "text-slate-400 hover:text-white hover:bg-white/5")
                  }`}
                >
                  <Icon className={`w-5 h-5 shrink-0 transition-colors ${
                    isActive ? (highContrast ? "text-black" : "text-white") : "text-slate-500 group-hover:text-white"
                  }`} />
                  {!sidebarCollapsed && (
                    <span className="text-sm truncate animate-in fade-in slide-in-from-left-2 duration-300">
                      {item.name}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Actions */}
      <div className="mt-auto space-y-4 pt-8 border-t border-white/5">
        <button 
          title={sidebarCollapsed ? "Emitir Relatório" : ""}
          className={`w-full flex items-center bg-primary text-on-primary font-body font-bold text-sm shadow-lg hover:brightness-110 transition-all rounded-2xl ${
            sidebarCollapsed ? "justify-center p-3" : "gap-3 px-4 py-4"
          }`}
        >
          <FileText className="w-5 h-5 shrink-0" />
          {!sidebarCollapsed && <span className="truncate">Emitir Relatório</span>}
        </button>

        <div className="space-y-1">
          <button 
            title={sidebarCollapsed ? "Suporte" : ""}
            className={`w-full flex items-center transition-all text-sm font-medium ${
              sidebarCollapsed ? "justify-center p-3" : "gap-3 px-4 py-3"
            } ${
              highContrast ? "text-white/70 hover:text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            <HelpCircle className="w-5 h-5 shrink-0" />
            {!sidebarCollapsed && <span>Suporte</span>}
          </button>
          
          <button 
            onClick={handleLogout}
            title={sidebarCollapsed ? "Sair" : ""}
            className={`w-full flex items-center transition-all text-sm font-medium ${
              sidebarCollapsed ? "justify-center p-3" : "gap-3 px-4 py-3"
            } ${
              highContrast ? "text-error hover:brightness-125" : "text-slate-400 hover:text-error"
            }`}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!sidebarCollapsed && <span>Sair</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
