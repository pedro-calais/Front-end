import React, { useState } from "react";
import { Link } from "react-router-dom"; // Import do Link para o MCSA funcionar
import {   
  Loader2, 
  ChevronRight, 
  AlertCircle, 
} from "lucide-react";
import { clienteService, type Cliente, type DetalhesCliente } from "../services/clienteService";

// --- UTILITÁRIOS ---
const formatMoney = (val: number | undefined) => 
  val ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val) : '-';

// Componente de Tabela Limpa (Idêntico ao da imagem)
const TableSection = ({ title, columns, children, isEmpty }: any) => (
    <div className="mb-8 animate-fade-in-up">
        <h3 className="text-lg font-bold text-slate-800 mb-3 ml-1">{title}</h3>
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                        {columns.map((col: string, idx: number) => (
                            <th key={idx} className="py-3 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                {col}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {isEmpty ? (
                        <tr>
                            <td colSpan={columns.length} className="py-6 text-center text-slate-400 italic text-xs bg-slate-50/30">
                                empty
                            </td>
                        </tr>
                    ) : children}
                </tbody>
            </table>
        </div>
    </div>
);

const ConsultarCliente = () => {
  // --- ESTADOS ---
  const [termo, setTermo] = useState("");
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [buscou, setBuscou] = useState(false);

  // Detalhes (SPA)
  const [selectedCliente, setSelectedCliente] = useState<DetalhesCliente | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // --- AÇÕES ---
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termo.trim()) return;
    setLoadingSearch(true);
    setBuscou(true);
    setSelectedCliente(null);
    try {
      const resultados = await clienteService.buscar(termo);
      setClientes(resultados);
    } catch (error) {
      console.error("Erro busca", error);
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleSelectCliente = async (id: number) => {
    setLoadingDetail(true);
    try {
      const detalhes = await clienteService.getById(id.toString());
      setSelectedCliente(detalhes);
    } catch (error) {
      console.error("Erro detalhes", error);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleNewSearch = () => {
    setSelectedCliente(null);
    // Opcional: Se quiser limpar a busca anterior ao clicar em "Nova Consulta":
    // setTermo(""); setClientes([]); setBuscou(false);
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 pb-20">
      
      {/* HEADER PADRÃO MCSA (Mantendo a identidade visual) */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-50 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-8">
            <Link to="/" className="text-2xl font-black tracking-tighter text-slate-900 cursor-pointer">
                MCSA
            </Link>
            <div className="h-6 w-px bg-slate-200 hidden md:block"></div>
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest hidden md:block">
                Consultar Cliente
            </h2>
        </div>
        <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-md">AD</div>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="max-w-[1400px] mx-auto p-8">

        {/* 1. MODO BUSCA (Se não tiver cliente selecionado) */}
        {!selectedCliente && !loadingDetail ? (
            <div className="animate-fade-in-up">
                <h1 className="text-3xl font-black text-slate-900 mb-8">Consultar Cliente</h1>
                
                {/* Formulário de Busca */}
                <div className="mb-10">
                    <form onSubmit={handleSearch}>
                        <label className="block text-xs font-bold text-slate-500 mb-2">Digite o Nome ou CPF/CNPJ do Cliente</label>
                        <div className="flex flex-col md:flex-row gap-4">
                            {/* Input Cinza Largo */}
                            <input 
                                type="text" 
                                value={termo}
                                onChange={(e) => setTermo(e.target.value)}
                                placeholder="Ex: Pedro Silva"
                                className="flex-1 bg-[#F3F4F6] border-none rounded-lg px-4 py-3 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all"
                            />
                            
                            {/* Botões */}
                            <div className="flex gap-3 w-full md:w-auto">
                                <button type="submit" disabled={loadingSearch || !termo} className="bg-white border border-red-500 text-red-500 hover:bg-red-50 px-8 py-3 rounded-lg font-bold text-sm transition-colors w-full md:w-32 flex justify-center uppercase tracking-wide">
                                    {loadingSearch ? <Loader2 className="w-5 h-5 animate-spin" /> : "Buscar"}
                                </button>
                                <button type="button" onClick={() => {setTermo(""); setClientes([]); setBuscou(false);}} className="bg-white border border-slate-300 text-slate-500 hover:bg-slate-50 px-8 py-3 rounded-lg font-bold text-sm transition-colors w-full md:w-32 uppercase tracking-wide">
                                    Limpar
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Feedback e Tabela */}
                {buscou && !loadingSearch && (
                    <div>
                        {clientes.length > 0 ? (
                            <>
                                <div className="bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 px-4 py-3 mb-6 text-sm font-bold shadow-sm">
                                    Resultados encontrados!
                                </div>
                                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                                    <table className="w-full text-left">
                                        <thead className="bg-white border-b border-slate-200">
                                            <tr>
                                                <th className="py-3 px-6 text-[10px] font-bold text-slate-400 uppercase w-20 text-center">ID</th>
                                                <th className="py-3 px-6 text-[10px] font-bold text-slate-400 uppercase">Cliente</th>
                                                <th className="py-3 px-6 text-[10px] font-bold text-slate-400 uppercase">CPF/CNPJ</th>
                                                <th className="py-3 px-6 text-[10px] font-bold text-slate-400 uppercase">Campanha</th>
                                                <th className="w-10"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {clientes.map((cli) => (
                                                <tr key={cli.id} onClick={() => handleSelectCliente(cli.id)} className="hover:bg-red-50/50 cursor-pointer transition-colors group even:bg-slate-50/30">
                                                    <td className="py-4 px-6 text-xs font-bold text-slate-400 text-center">{cli.id}</td>
                                                    <td className="py-4 px-6 text-xs font-bold text-slate-700 uppercase">{cli.nome}</td>
                                                    <td className="py-4 px-6 text-xs text-slate-600 font-mono">{cli.documento}</td>
                                                    <td className="py-4 px-6 text-xs text-slate-500">{cli.campanha}</td>
                                                    <td className="py-4 px-6 text-slate-300 group-hover:text-red-500"><ChevronRight className="w-5 h-5" /></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        ) : (
                            <div className="bg-slate-50 border-l-4 border-slate-300 text-slate-500 px-4 py-3 text-sm font-bold">Nenhum resultado encontrado.</div>
                        )}
                    </div>
                )}
            </div>
        ) : (
            // 2. MODO DETALHES (Ficha do Cliente)
            <div className="animate-fade-in-up">
                
                {/* Botão Superior "Nova Consulta" (Estilo barra da imagem) */}
                <button 
                    onClick={handleNewSearch} 
                    className="w-full bg-white border border-slate-200 text-slate-500 font-medium text-xs uppercase tracking-widest py-3 rounded-lg hover:border-slate-400 hover:text-slate-800 transition-all mb-8 shadow-sm"
                >
                    Nova Consulta
                </button>

                {loadingDetail ? (
                    <div className="flex flex-col items-center justify-center py-32 opacity-50">
                        <Loader2 className="w-10 h-10 animate-spin text-slate-400 mb-2" />
                        <span className="text-sm font-medium text-slate-400">Carregando ficha...</span>
                    </div>
                ) : selectedCliente ? (
                    <div>
                        {/* Cabeçalho do Cliente */}
                        <div className="flex flex-col md:flex-row justify-between items-start mb-10 pb-6 border-b border-slate-100">
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Cliente</span>
                                <h1 className="text-3xl font-medium text-slate-900 uppercase tracking-tight mb-3">{selectedCliente.cliente.nome}</h1>
                                
                                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">CPF / CNPJ</span>
                                <p className="text-xl text-slate-600 font-normal tracking-wide">{selectedCliente.cliente.documento}</p>
                            </div>
                            <div className="mt-6 md:mt-0 text-right">
                                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Campanha</span>
                                <p className="text-xl text-slate-700 font-normal">{selectedCliente.cliente.campanha}</p>
                            </div>
                        </div>

                        {/* Tabela 1: Títulos */}
                        <TableSection 
                            title="Títulos" 
                            columns={["Número", "Parcela", "Vencimento", "Valor Original", "Status"]}
                            isEmpty={selectedCliente.titulos_abertos.length === 0}
                        >
                            {selectedCliente.titulos_abertos.map((t) => (
                                <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="py-4 px-5 text-slate-600 font-medium">{t.numero}</td>
                                    <td className="py-4 px-5 text-slate-600">{t.parcela}</td>
                                    <td className="py-4 px-5 text-slate-600">{t.vencimento}</td>
                                    <td className="py-4 px-5 text-slate-800 font-bold">{formatMoney(t.valor)}</td>
                                    <td className="py-4 px-5"><span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold border border-slate-200">ABERTO</span></td>
                                </tr>
                            ))}
                        </TableSection>

                        {/* Tabela 2: Títulos Pagos */}
                        <TableSection 
                            title="Títulos Pagos" 
                            columns={["Credor", "Data Acordo", "Vencimento", "N Título", "Parcela", "Data Pagamento", "Valor Pago", "Negociador", "Status"]}
                            isEmpty={selectedCliente.titulos_pagos.length === 0}
                        >
                            {selectedCliente.titulos_pagos.map((t) => (
                                <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="py-4 px-5 text-slate-700 font-bold text-xs">{t.credor}</td>
                                    <td className="py-4 px-5 text-slate-500 text-xs">{t.data_acordo}</td>
                                    <td className="py-4 px-5 text-slate-500 text-xs">{t.vencimento}</td>
                                    <td className="py-4 px-5 text-slate-500 text-xs">{t.numero}</td>
                                    <td className="py-4 px-5 text-slate-500 text-xs">{t.parcela}</td>
                                    <td className="py-4 px-5 text-slate-500 text-xs">{t.data_pagamento}</td>
                                    <td className="py-4 px-5 text-slate-800 font-bold text-xs">{formatMoney(t.valor_pago)}</td>
                                    <td className="py-4 px-5 text-slate-500 text-xs">{t.negociador}</td>
                                    <td className="py-4 px-5"><span className="text-[10px] text-emerald-600 font-bold uppercase">PAGO</span></td>
                                </tr>
                            ))}
                        </TableSection>

                        {/* Tabela 3: Histórico */}
                        <TableSection 
                            title="Histórico de ROs" 
                            columns={["Negociador Responsável", "RO", "Negociador RO", "Data", "Descrição"]}
                            isEmpty={selectedCliente.historico.length === 0}
                        >
                            {selectedCliente.historico.map((h) => (
                                <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                                    {/* CORREÇÃO: Usando apenas os campos que existem na interface */}
                                    <td className="py-4 px-5 text-slate-700 font-medium text-xs">{h.negociador_responsavel}</td>
                                    <td className="py-4 px-5 text-slate-600 text-xs">{h.ro}</td>
                                    <td className="py-4 px-5 text-slate-500 text-xs">{h.negociador_ro}</td>
                                    <td className="py-4 px-5 text-slate-500 font-mono text-xs">{h.data}</td>
                                    <td className="py-4 px-5 text-slate-500 text-xs max-w-md truncate" title={h.descricao}>{h.descricao}</td>
                                </tr>
                            ))}
                        </TableSection>

                    </div>
                ) : (
                    <div className="bg-red-50 text-red-500 p-6 rounded-lg flex items-center justify-center gap-2">
                        <AlertCircle className="w-5 h-5" /> Erro ao carregar ficha do cliente.
                    </div>
                )}
            </div>
        )}

      </main>
    </div>
  );
};

export default ConsultarCliente;