"use client";

import React from "react";
import { useTheme } from "~/app/_components/ThemeContext";
import { Sidebar } from "~/app/_components/layout/Sidebar";
import { Header } from "~/app/_components/layout/Header";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { highContrast } = useTheme();

  return (
    <div className={`h-screen flex overflow-hidden transition-colors ${highContrast ? "bg-black" : "bg-surface"}`}>
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header deskName="Sistema e Acessos" />
        
        <main className="flex-1 p-8 md:p-10 overflow-y-auto">
           {children}
        </main>
      </div>
    </div>
  );
}
