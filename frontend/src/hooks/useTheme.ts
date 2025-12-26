// src/hooks/useTheme.ts
import { useState, useEffect } from 'react';

// Define o tipo para o tema
type Theme = 'light' | 'dark';

export const useTheme = () => {
    // 1. Inicializa o estado com base no localStorage ou preferência do sistema
    const [theme, setTheme] = useState<Theme>(() => {
        // Tenta buscar do localStorage primeiro
        const localTheme = localStorage.getItem('theme') as Theme;
        if (localTheme) {
            return localTheme;
        }
        // Se não houver, verifica a preferência de sistema do usuário
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    });

    const isDark = theme === 'dark';

    // 2. Efeito para aplicar as classes CSS ao <html> e salvar no localStorage
    useEffect(() => {
        const root = window.document.documentElement;
        
        // Remove a classe oposta e adiciona a classe atual
        root.classList.remove(isDark ? 'light' : 'dark');
        root.classList.add(theme);
        
        // Salva a preferência no armazenamento local
        localStorage.setItem('theme', theme);
    }, [theme, isDark]);

    // 3. Função para alternar o tema
    const toggleTheme = () => {
        setTheme(isDark ? 'light' : 'dark');
    };

    return {
        theme,
        isDark,
        toggleTheme,
    };
};