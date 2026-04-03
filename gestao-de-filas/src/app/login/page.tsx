"use client"

import React, { useState } from "react"
import { signIn } from "next-auth/react"
import { useTheme } from "../_components/ThemeContext"
import { ThemeToggle } from "../_components/ThemeToggle"
import { Shield, ArrowRight, User as UserIcon, Lock, AlertCircle, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const { highContrast } = useTheme()
  const router = useRouter()
  
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Usuário ou senha inválidos.")
      } else {
        router.push("/dashboard")
        router.refresh()
      }
    } catch (err) {
      setError("Ocorreu um erro ao tentar entrar.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className={`min-h-screen flex flex-col items-center justify-center p-6 transition-colors relative overflow-hidden ${
      highContrast ? "bg-black" : "bg-surface"
    }`}>
      {/* Decorative Background */}
      {!highContrast && (
        <>
          <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-primary/3 rounded-full blur-[100px]" />
        </>
      )}

      {/* Header/Logo */}
      <div className="absolute top-10 left-12 flex items-center gap-3">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white text-xl shadow-lg">
           🏛️
        </div>
        <div className="hidden sm:block">
          <h2 className={`text-sm font-display font-black tracking-widest uppercase ${
            highContrast ? "text-white" : "text-primary"
          }`}>
            SIGA
          </h2>
          <p className="text-[9px] font-body font-bold opacity-40 uppercase tracking-tighter">
            Gestão de Atendimento
          </p>
        </div>
      </div>

      <div className="absolute top-10 right-12">
        <ThemeToggle />
      </div>

      {/* Login Card */}
      <div className={`w-full max-w-md p-10 md:p-12 rounded-[3.5rem] transition-all animate-in fade-in zoom-in duration-500 ${
        highContrast 
          ? "bg-black border-4 border-white" 
          : "bg-surface-lowest shadow-ambient border border-primary/5"
      }`}>
        <div className="text-center mb-10">
          <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 ${
            highContrast ? "bg-white text-black" : "bg-primary/5 text-primary"
          }`}>
             <Shield className="w-8 h-8" />
          </div>
          <h1 className={`text-3xl font-display font-black tracking-tight mb-2 ${
            highContrast ? "text-white" : "text-primary"
          }`}>
            Portal do Servidor
          </h1>
          <p className={`text-sm font-body px-4 ${
            highContrast ? "text-white/60" : "text-secondary/60"
          }`}>
            Entre com suas credenciais oficiais para acessar o terminal.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
           {error && (
             <div className={`p-4 rounded-2xl flex items-center gap-3 border animate-in slide-in-from-top-2 duration-300 ${
               highContrast ? "border-white bg-white/10 text-white" : "bg-error-container/20 border-error/10 text-error"
             }`}>
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span className="text-xs font-bold">{error}</span>
             </div>
           )}

           <div className="space-y-2">
              <label className={`text-[10px] uppercase font-black tracking-widest ml-1 ${
                highContrast ? "text-white/50" : "text-secondary/60"
              }`}>
                Usuário ou CPF
              </label>
              <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl border transition-all focus-within:ring-2 ${
                highContrast 
                  ? "bg-black border-white focus-within:ring-white" 
                  : "bg-surface-low border-primary/5 focus-within:border-primary/20 focus-within:ring-primary/10"
              }`}>
                <UserIcon className={`w-5 h-5 ${highContrast ? "text-white/40" : "text-secondary/30"}`} />
                <input 
                  type="text" 
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`bg-transparent w-full outline-none text-sm font-body ${
                    highContrast ? "text-white placeholder:text-white/20" : "text-primary placeholder:text-secondary/30"
                  }`}
                  placeholder="Seu identificador"
                />
              </div>
           </div>

           <div className="space-y-2">
              <label className={`text-[10px] uppercase font-black tracking-widest ml-1 ${
                highContrast ? "text-white/50" : "text-secondary/60"
              }`}>
                Senha
              </label>
              <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl border transition-all focus-within:ring-2 ${
                highContrast 
                  ? "bg-black border-white focus-within:ring-white" 
                  : "bg-surface-low border-primary/5 focus-within:border-primary/20 focus-within:ring-primary/10"
              }`}>
                <Lock className={`w-5 h-5 ${highContrast ? "text-white/40" : "text-secondary/30"}`} />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`bg-transparent w-full outline-none text-sm font-body ${
                    highContrast ? "text-white placeholder:text-white/20" : "text-primary placeholder:text-secondary/30"
                  }`}
                  placeholder="••••••••"
                />
              </div>
           </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-5 px-6 rounded-2xl flex items-center justify-between font-display font-black text-lg transition-all group mt-8 ${
              isLoading ? "opacity-70 cursor-not-allowed" : "hover:scale-[1.02] active:scale-[0.98]"
            } ${
              highContrast 
                ? "bg-white text-black" 
                : "bg-primary text-on-primary shadow-lg shadow-primary/20 hover:brightness-110"
            }`}
          >
            <span>{isLoading ? "Validando..." : "Acessar Portal"}</span>
            {isLoading ? (
               <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
               <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            )}
          </button>
        </form>
      </div>

      {/* Footer Info */}
      <div className="mt-12 text-center">
         <p className={`text-[10px] uppercase font-black tracking-[0.3em] opacity-30 ${
           highContrast ? "text-white" : "text-primary"
         }`}>
           Secretaria de Gestão Administrativa
         </p>
      </div>
    </main>
  )
}
