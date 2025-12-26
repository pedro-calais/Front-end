import { api } from "../api/api";


// --- TIPAGEM ---
export interface DetalheContrato {
  campanha: string;
  meta: number;
  realizado: number;
}

export interface NegociadorFront {
  id: number;
  nome: string;
  avatar: string;
  status: "meta" | "atencao" | "critico";
  meta: number;
  realizado: number;
  projecao: number;
  percentual: number;
  detalhes: DetalheContrato[];
}

export interface StatsCelula {
  objetivo: number;
  realizado: number;
  percentual: number;
  tempo: number;
}

export interface CelulaFront {
  id: number;
  nome: string;
  lider: string;
  stats: StatsCelula;
  negociadores: NegociadorFront[];
}

// --- SERVIÇO ---
export const negociadorService = {
  getByPeriodo: async (
    dataInicio: string,
    dataFim: string
  ): Promise<CelulaFront[]> => {
    try {
      const { data } = await api.get("/negociador_celula/resumo", {
        params: { data_inicio: dataInicio, data_fim: dataFim },
      });

      // O Backend já retorna a estrutura pronta, não precisa de map complexo
      return data;
      
    } catch (error) {
      console.error("Erro no serviço de negociadores:", error);
      throw error;
    }
  },
};

