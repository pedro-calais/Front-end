import { api } from "../api/api";

// Dados básicos do Cliente
export interface Cliente {
  id: number;
  nome: string;
  documento: string;
  campanha: string;
}

// Títulos em Aberto (Financeiro)
export interface TituloAberto {
  id: number;
  numero: string;
  parcela: string;
  vencimento: string;
  valor: number;
  status: string;
}

// Títulos Pagos (Financeiro + Acordo)
export interface TituloPago {
  id: number;
  credor: string;
  data_acordo: string;
  vencimento: string;
  numero: string;
  parcela: string;
  data_pagamento: string;
  valor_pago: number;
  negociador: string;
  status: string;
}

// Histórico de ROs (Operacional)
// Baseado na imagem: Negociador Responsável | RO | Negociador RO | Data | Descrição
export interface HistoricoRO {
  id: number;
  negociador_responsavel: string;
  ro: string;
  negociador_ro: string;
  data: string;
  descricao: string;
}

export interface DetalhesCliente {
  cliente: Cliente;
  titulos_abertos: TituloAberto[];
  titulos_pagos: TituloPago[];
  historico: HistoricoRO[];
}

export const clienteService = {
  buscar: async (termo: string): Promise<Cliente[]> => {
    if (!termo) return [];
    const response = await api.get(`/clientes/buscar?q=${termo}`);
    return response.data;
  },

  getById: async (id: string): Promise<DetalhesCliente> => {
    const response = await api.get(`/clientes/${id}`);
    return response.data;
  }
};