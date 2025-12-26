import React, { createContext, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../api/api'; // Garanta que o caminho está certo

export const TelemetryContext = createContext({});

export const TelemetryProvider = ({ children }: { children: React.ReactNode }) => {
    const location = useLocation();
    const startTimeRef = useRef<number>(Date.now());
    
    // Pega o user salvo no login
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    // 1. HEARTBEAT (Bate a cada 30 segundos se tiver usuário)
    useEffect(() => {
        if (!user || !user.id) return;

        const sendHeartbeat = async () => {
            try {
                // Ajuste a URL se seu backend for diferente
                await api.post('/telemetry/heartbeat', { user_id: user.id });
                console.log("💓 Heartbeat enviado");
            } catch (error) {
                console.error("Erro no heartbeat", error);
            }
        };

        sendHeartbeat(); // Envia o primeiro já de cara
        const interval = setInterval(sendHeartbeat, 60000); // 60s
        return () => clearInterval(interval);
    }, [user?.id]);

    // 2. LOG DE NAVEGAÇÃO (Muda de tela)
    useEffect(() => {
        if (!user || !user.id) return;

        const endTime = Date.now();
        const duration = (endTime - startTimeRef.current) / 1000;
        
        // Loga a tela anterior (se ficou mais de 1s)
        if (duration > 1) {
            api.post('/telemetry/log', {
                user_id: user.id,
                route: location.pathname,
                action: 'PAGE_VIEW',
                duration: Math.round(duration),
                details: `Navegou para ${location.pathname}`
            }).catch(err => console.error(err));
        }

        startTimeRef.current = Date.now();
    }, [location.pathname, user?.id]);

    return (
        <TelemetryContext.Provider value={{}}>
            {children}
        </TelemetryContext.Provider>
    );
};