"use client"
import Link from "next/link";
import { useTheme } from "./_components/ThemeContext";
import { ThemeToggle } from "./_components/ThemeToggle";

export default function Home() {
  const { highContrast } = useTheme();

  return (
    <main className={`flex min-h-screen flex-col items-center justify-center transition-colors relative ${
      highContrast 
        ? "bg-slate-900 text-white" 
        : "bg-gradient-to-b from-[#f8fafc] to-[#e2e8f0] text-slate-900"
    }`}>
      <div className="absolute top-8 right-8">
        <ThemeToggle />
      </div>

      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <div className="text-center">
          <div className="text-8xl mb-6 inline-block" aria-hidden="true">🏛️</div>
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem] mb-4">
            Gestão de <span className="text-blue-600">Filas</span>
          </h1>
          <p className={`text-xl font-medium ${highContrast ? "text-slate-400" : "text-slate-600"}`}>
            Escolha o portal de acesso ao sistema
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 md:gap-8 w-full max-w-5xl">
          <Link
            className={`flex flex-col gap-4 rounded-2xl p-8 border-2 transition-all hover:scale-105 ${
              highContrast 
                ? "bg-slate-800 border-slate-700 hover:border-white" 
                : "bg-white border-transparent shadow-xl hover:shadow-2xl"
            }`}
            href="/totem"
          >
            <div className="text-4xl">🎟️</div>
            <h3 className="text-2xl font-bold">Totem →</h3>
            <div className={`text-lg ${highContrast ? "text-slate-400" : "text-slate-600"}`}>
              Emissão de senhas e triagem de cidadãos.
            </div>
          </Link>

          <Link
            className={`flex flex-col gap-4 rounded-2xl p-8 border-2 transition-all hover:scale-105 ${
              highContrast 
                ? "bg-slate-800 border-slate-700 hover:border-white" 
                : "bg-white border-transparent shadow-xl hover:shadow-2xl"
            }`}
            href="/guiche"
          >
            <div className="text-4xl">👨‍💼</div>
            <h3 className="text-2xl font-bold">Guichê →</h3>
            <div className={`text-lg ${highContrast ? "text-slate-400" : "text-slate-600"}`}>
              Interface para atendentes chamarem e gerenciarem senhas.
            </div>
          </Link>

          <Link
            className={`flex flex-col gap-4 rounded-2xl p-8 border-2 transition-all hover:scale-105 ${
              highContrast 
                ? "bg-slate-800 border-slate-700 hover:border-white" 
                : "bg-white border-transparent shadow-xl hover:shadow-2xl"
            }`}
            href="/painel"
          >
            <div className="text-4xl">📺</div>
            <h3 className="text-2xl font-bold">Painel →</h3>
            <div className={`text-lg ${highContrast ? "text-slate-400" : "text-slate-600"}`}>
              Exibição pública de chamadas com aviso sonoro.
            </div>
          </Link>

          <Link
            className={`flex flex-col gap-4 rounded-2xl p-8 border-2 transition-all hover:scale-105 ${
              highContrast 
                ? "bg-slate-800 border-slate-700 hover:border-white" 
                : "bg-white border-transparent shadow-xl hover:shadow-2xl"
            }`}
            href="/dashboard"
          >
            <div className="text-4xl">📊</div>
            <h3 className="text-2xl font-bold">Dashboard →</h3>
            <div className={`text-lg ${highContrast ? "text-slate-400" : "text-slate-600"}`}>
              Monitoramento em tempo real com alertas de SLA para supervisores.
            </div>
          </Link>
        </div>

        <div className={`mt-8 text-sm ${highContrast ? "text-slate-600" : "text-slate-400"}`}>
          Sistema Integrado de Gestão · 2026
        </div>
      </div>
    </main>
  );
}
