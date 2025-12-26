import React from "react";

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-900 font-sans selection:bg-slate-200 selection:text-black overflow-x-hidden">
      
    

      {/* ÁREA DE CONTEÚDO */}
      
      <main className="flex-1 w-full h-full animate-fade-in-up">
        {children}
      </main>
    </div>
  );
};