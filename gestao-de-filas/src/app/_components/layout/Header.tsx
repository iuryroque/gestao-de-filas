import React from "react";
import { Bell, Search, User, Menu, ChevronLeft } from "lucide-react";
import { useTheme } from "../ThemeContext";
import { ThemeToggle } from "../ThemeToggle";
import { useSession } from "next-auth/react";

export function Header({ deskName, status }: { deskName?: string; status?: string }) {
  const { highContrast, sidebarCollapsed, toggleSidebar } = useTheme();
  const { data: session } = useSession();

  const userDisplayName = session?.user?.name || "Usuário";
  const userRole = session?.user?.role || "Atendente";
  const userImage = session?.user?.image;

  return (
    <header className={`px-10 py-6 flex justify-between items-center z-10 transition-all ${
      highContrast 
        ? "bg-black border-b border-white" 
        : "bg-surface-lowest/80 backdrop-blur-md text-primary"
    }`}>
      <div className="flex items-center gap-6">
        {/* Menu Toggle in Header - Semantic Icons */}
        <button 
          onClick={toggleSidebar}
          className={`p-2.5 rounded-xl transition-all hover:scale-105 active:scale-95 ${
            highContrast ? "hover:bg-white/10 text-white" : "hover:bg-primary/5 text-secondary"
          }`}
          title={sidebarCollapsed ? "Expandir Menu" : "Recolher Menu"}
        >
          <Menu className={`w-6 h-6 transition-all duration-300 ${sidebarCollapsed ? "opacity-40 rotate-180 scale-75" : "opacity-100 rotate-0 scale-100"}`} />
        </button>

        <div className="flex flex-col">
          <h1 className={`text-xl font-display font-black tracking-tight ${
            highContrast ? "text-white" : "text-primary"
          }`}>
            {deskName || "Gestão de Filas"}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <div className={`w-2 h-2 rounded-full ${
                status === "paused" ? "bg-warning" : "bg-success animate-pulse"
            }`} />
            <span className={`text-[10px] uppercase font-bold tracking-widest ${
              highContrast ? "text-white/50" : "text-secondary/60"
            }`}>
              {status === "paused" ? "Em Pausa" : "Operação Ativa"}
            </span>
          </div>
        </div>

        {!highContrast && (
          <div className="hidden xl:flex items-center gap-3 bg-surface-low px-4 py-2.5 rounded-xl min-w-[300px]">
            <Search className="w-4 h-4 text-secondary/40" />
            <span className="text-xs text-secondary/40 font-body">Procurar ticket ou cidadão...</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <button className={`p-2.5 rounded-xl transition-all ${
            highContrast ? "hover:bg-white/10" : "hover:bg-primary/5 text-secondary"
          }`}>
            <Bell className="w-5 h-5" />
          </button>
          
          <div className="h-6 w-px mx-2" />

          <div className="flex items-center gap-3">
             <div className="text-right hidden sm:block">
                <p className={`text-[11px] font-black tracking-tight leading-none ${
                  highContrast ? "text-white" : "text-primary"
                }`}>
                  {userDisplayName}
                </p>
                <p className="text-[9px] font-bold opacity-40 uppercase tracking-tighter mt-1">
                  {userRole === 'admin' ? 'Administrador' : userRole === 'supervisor' ? 'Supervisor' : 'Atendente'}
                </p>
             </div>
             <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold relative overflow-hidden ${
               highContrast ? "bg-white text-black" : "bg-primary text-on-primary shadow-ambient"
             }`}>
                {userImage ? (
                  <img src={userImage} alt={userDisplayName} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5" />
                )}
             </div>
          </div>
        </div>
      </div>
    </header>
  );
}
