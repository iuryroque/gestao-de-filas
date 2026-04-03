"use client"

import React, { useState } from "react"
import { api } from "~/trpc/react"
import { useTheme } from "~/app/_components/ThemeContext"
import { Shield, Plus, Lock, Settings2 } from "lucide-react"

export default function GruposAdminPage() {
  const { highContrast } = useTheme()
  const { data: groups = [], isLoading } = api.admin.getGroups.useQuery()

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="mb-10 flex justify-between items-end animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <h1 className={`text-4xl font-display font-black tracking-tight mb-2 ${highContrast ? "text-white" : "text-primary"}`}>
            Grupos de Acesso
          </h1>
          <p className={`text-sm font-body max-w-xl ${highContrast ? "text-white/60" : "text-secondary/70"}`}>
            Configure as permissões mestre do sistema. Todos os usuários vinculados a um grupo herdam automaticamente suas permissões de acesso.
          </p>
        </div>
        
        <button className={`px-6 py-3 rounded-2xl flex items-center gap-3 font-display font-black shadow-lg transition-all hover:scale-105 active:scale-95 ${
          highContrast ? "bg-white text-black" : "bg-primary text-on-primary"
        }`}>
           <Plus className="w-5 h-5" />
           Novo Grupo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
           <div className={`p-8 rounded-[2rem] border border-dashed flex justify-center py-16 ${highContrast ? "border-white/20" : "border-primary/10"}`}>
             <p className={`text-sm font-body italic ${highContrast ? "text-white/50" : "text-secondary/50"}`}>Carregando grupos...</p>
           </div>
        ) : groups.map(group => (
           <div key={group.id} className={`p-8 rounded-[2rem] flex flex-col transition-all group-hover:shadow-xl ${
             highContrast ? "bg-black border-2 border-white hover:bg-white/10" : "bg-surface-lowest shadow-ambient border border-primary/5 hover:border-primary/20"
           }`}>
             <div className="flex justify-between items-start mb-6">
               <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                 highContrast ? "bg-white text-black" : "bg-primary/5 text-primary"
               }`}>
                 <Shield className="w-6 h-6" />
               </div>
               <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                 highContrast ? "bg-white text-black" : "bg-surface-low text-primary"
               }`}>
                 {group._count.users} Usuários
               </span>
             </div>
             
             <h3 className={`text-2xl font-display font-black mb-2 ${highContrast ? "text-white" : "text-primary"}`}>
               {group.name}
             </h3>
             <p className={`text-sm font-body mb-8 line-clamp-2 ${highContrast ? "text-white/60" : "text-secondary/70"}`}>
               {group.description || "Sem descrição"}
             </p>
             
             <div className="mt-auto space-y-4">
               <div className={`flex items-center gap-2 text-xs font-bold ${highContrast ? "text-white/50" : "text-secondary/50"}`}>
                  <Lock className="w-4 h-4" />
                  <span>{group.permissions.length} Permissões ativas</span>
               </div>
               
               <button className={`w-full py-3 flex items-center justify-center gap-2 rounded-xl text-sm font-bold transition-colors ${
                 highContrast ? "bg-white text-black hover:bg-white/80" : "bg-primary/5 text-primary hover:bg-primary/10"
               }`}>
                 <Settings2 className="w-4 h-4" />
                 Gerenciar Acessos
               </button>
             </div>
           </div>
        ))}
      </div>
    </div>
  )
}
