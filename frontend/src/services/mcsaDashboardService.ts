// src/services/mcsaDashboardService.ts

// Interface com todas as métricas do Dashboard
export interface McsaDashboardMetrics {
  painel_objetivo: number;
  painel_objetivo_variacao: number;

  resumo_objetivo: number;
  resumo_objetivo_variacao: number;

  atividades: number;
  projetos: number;
  pendencias: number;

  usuarios_total: number;
  usuarios_ativos: number;
  usuarios_novos_30d: number;
}

// MOCK TEMPORÁRIO ⭐
// Você pode ajustar esses valores até conectar com a API real
const mockDashboardData: McsaDashboardMetrics = {
  painel_objetivo: 125.4,
  painel_objetivo_variacao: 12.5,

  resumo_objetivo: 87,
  resumo_objetivo_variacao: 5.2,

  atividades: 42,
  projetos: 18,
  pendencias: 7,

  usuarios_total: 248,
  usuarios_ativos: 156,
  usuarios_novos_30d: 12,
};

// Função mock para simular requisição
export async function fetchMcsaDashboard(): Promise<McsaDashboardMetrics> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockDashboardData), 300); // Delay fake
  });
}
