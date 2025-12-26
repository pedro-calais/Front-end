// src/components/ui/Card.tsx
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  className?: string; // Permite estilização customizada via Tailwind
}

// O componente Card: Usa classes para fundo, borda e sombra que se adaptam ao tema.
export const Card: React.FC<CardProps> = ({ children, title, className = '' }) => {
  return (
    <div
      className={`
        // Fundo e Texto: Clássico (Light) -> Cinza Escuro (Dark)
        bg-white dark:bg-zinc-800 
        text-gray-900 dark:text-gray-100
        
        // Estética: Cantos arredondados, sombra e borda sutil
        rounded-xl shadow-lg 
        border border-gray-100 dark:border-zinc-700
        
        // Padding e Transição
        p-6 transition-all duration-300
        ${className} // Aplica classes customizadas do usuário por último
      `}
    >
      {title && (
        <h3 className="text-xl font-semibold mb-4 border-b border-gray-200 dark:border-zinc-700 pb-3">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
};